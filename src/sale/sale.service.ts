import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, UpdateSaleDto } from './dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class SaleService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSaleDto, userId: string) {
    const { depotId, clientId, lines, discount, tax, notes } = dto;

    const depot = await this.prisma.depot.findUnique({ where: { id: depotId } });
    if (!depot) {
      throw new NotFoundException(`Depot with ID ${depotId} not found`);
    }

    if (clientId) {
      const client = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (!client) {
        throw new NotFoundException(`Client with ID ${clientId} not found`);
      }
    }

    for (const line of lines) {
      const stock = await this.prisma.stock.findUnique({
        where: {
          productId_depotId: {
            productId: line.productId,
            depotId,
          },
        },
      });

      if (!stock || stock.quantity < line.quantity) {
        const product = await this.prisma.product.findUnique({
          where: { id: line.productId },
        });
        throw new BadRequestException(
          `Insufficient stock for product ${product?.name || line.productId}`,
        );
      }
    }

    const saleNumber = await this.generateSaleNumber();

    let totalAmount = 0;
    const saleLines: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      discount: number;
    }> = [];

    for (const line of lines) {
      const product = await this.prisma.product.findUnique({
        where: { id: line.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${line.productId} not found`);
      }

      const unitPrice = line.unitPrice || product.sellingPrice;
      const lineDiscount = line.discount || 0;
      const totalPrice = unitPrice * line.quantity - lineDiscount;

      totalAmount += totalPrice;

      saleLines.push({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice,
        totalPrice,
        discount: lineDiscount,
      });
    }

    totalAmount = totalAmount - (discount || 0) + (tax || 0);

    const sale = await this.prisma.$transaction(async (tx) => {
      const createdSale = await tx.sale.create({
        data: {
          saleNumber,
          depotId,
          userId,
          clientId,
          totalAmount,
          discount: discount || 0,
          tax: tax || 0,
          remainingAmount: totalAmount,
          notes,
          lines: {
            create: saleLines,
          },
        },
        include: {
          lines: {
            include: {
              product: true,
            },
          },
          client: true,
          depot: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      for (const line of lines) {
        await tx.stock.update({
          where: {
            productId_depotId: {
              productId: line.productId,
              depotId,
            },
          },
          data: {
            quantity: {
              decrement: line.quantity,
            },
          },
        });

        const stock = await tx.stock.findUnique({
          where: {
            productId_depotId: {
              productId: line.productId,
              depotId,
            },
          },
        });

        if (!stock) {
          throw new NotFoundException(
            `Stock not found for product ${line.productId} in depot ${depotId}`,
          );
        }

        await tx.stockMovement.create({
          data: {
            stockId: stock.id,
            type: 'OUT',
            quantity: line.quantity,
            reason: 'Sale',
            reference: saleNumber,
          },
        });
      }

      return createdSale;
    });

    return sale;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.depotId) {
      where.depotId = filters.depotId;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          lines: {
            include: {
              product: true,
            },
          },
          client: true,
          depot: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            product: {
              include: {
                category: true,
                brand: true,
              },
            },
          },
        },
        client: true,
        depot: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        payments: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  async update(id: string, dto: UpdateSaleDto) {
    await this.findOne(id);

    return this.prisma.sale.update({
      where: { id },
      data: dto,
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        client: true,
      },
    });
  }

  async cancelSale(id: string) {
    const sale = await this.findOne(id);

    if (sale.status === PaymentStatus.CANCELLED) {
      throw new BadRequestException('Sale is already cancelled');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const line of sale.lines) {
        await tx.stock.update({
          where: {
            productId_depotId: {
              productId: line.productId,
              depotId: sale.depotId,
            },
          },
          data: {
            quantity: {
              increment: line.quantity,
            },
          },
        });

        const stock = await tx.stock.findUnique({
          where: {
            productId_depotId: {
              productId: line.productId,
              depotId: sale.depotId,
            },
          },
        });

        if (!stock) {
          throw new NotFoundException(
            `Stock not found for product ${line.productId} in depot ${sale.depotId}`,
          );
        }

        await tx.stockMovement.create({
          data: {
            stockId: stock.id,
            type: 'IN',
            quantity: line.quantity,
            reason: 'Sale Cancellation',
            reference: sale.saleNumber,
          },
        });
      }

      await tx.sale.update({
        where: { id },
        data: {
          status: PaymentStatus.CANCELLED,
        },
      });
    });

    return { message: 'Sale cancelled successfully' };
  }

  async getSalesReport(depotId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (depotId) {
      where.depotId = depotId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        lines: true,
        payments: true,
      },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPaid = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
    const totalDebt = sales.reduce((sum, sale) => sum + sale.remainingAmount, 0);

    return {
      totalSales,
      totalRevenue,
      totalPaid,
      totalDebt,
      sales,
    };
  }

  private async generateSaleNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const count = await this.prisma.sale.count({
      where: {
        createdAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
        },
      },
    });

    return `SALE-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
  }
}
