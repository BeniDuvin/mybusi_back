import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto, UpdatePurchaseDto } from './dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PurchaseService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePurchaseDto, userId: string) {
    const { depotId, supplierId, lines, notes, deliveryDate } = dto;

    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${supplierId} not found`);
    }

    const purchaseNumber = await this.generatePurchaseNumber();

    let totalAmount = 0;
    const purchaseLines: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const line of lines) {
      const product = await this.prisma.product.findUnique({
        where: { id: line.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${line.productId} not found`);
      }

      const totalPrice = line.unitPrice * line.quantity;
      totalAmount += totalPrice;

      purchaseLines.push({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice,
      });
    }

    const purchase = await this.prisma.$transaction(async (tx) => {
      const createdPurchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          depotId,
          userId,
          supplierId,
          totalAmount,
          remainingAmount: totalAmount,
          notes,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          lines: {
            create: purchaseLines,
          },
        },
        include: {
          lines: {
            include: {
              product: true,
            },
          },
          supplier: true,
          depot: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      for (const line of lines) {
        const stock = await tx.stock.upsert({
          where: {
            productId_depotId: {
              productId: line.productId,
              depotId,
            },
          },
          update: {
            quantity: {
              increment: line.quantity,
            },
          },
          create: {
            productId: line.productId,
            depotId,
            quantity: line.quantity,
          },
        });

        await tx.stockMovement.create({
          data: {
            stockId: stock.id,
            type: 'IN',
            quantity: line.quantity,
            reason: 'Purchase',
            reference: purchaseNumber,
          },
        });
      }

      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          totalDebt: {
            increment: totalAmount,
          },
        },
      });

      return createdPurchase;
    });

    return purchase;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.depotId) {
      where.depotId = filters.depotId;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [purchases, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        include: {
          lines: {
            include: {
              product: true,
            },
          },
          supplier: true,
          depot: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return {
      data: purchases,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findUnique({
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
        supplier: true,
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

    if (!purchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }

    return purchase;
  }

  async update(id: string, dto: UpdatePurchaseDto) {
    await this.findOne(id);

    return this.prisma.purchase.update({
      where: { id },
      data: dto,
    });
  }

  async payPurchase(id: string, amount: number) {
    const purchase = await this.findOne(id);

    if (amount > purchase.remainingAmount) {
      throw new BadRequestException('Payment amount exceeds remaining balance');
    }

    const newPaidAmount = purchase.paidAmount + amount;
    const newRemainingAmount = purchase.totalAmount - newPaidAmount;

    await this.prisma.$transaction(async (tx) => {
      await tx.purchase.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newRemainingAmount === 0 ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
        },
      });

      await tx.supplier.update({
        where: { id: purchase.supplierId },
        data: {
          totalDebt: {
            decrement: amount,
          },
        },
      });
    });

    return { message: 'Payment recorded successfully', paidAmount: newPaidAmount, remainingAmount: newRemainingAmount };
  }

  private async generatePurchaseNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const count = await this.prisma.purchase.count({
      where: {
        createdAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
        },
      },
    });

    return `PUR-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
  }
}
