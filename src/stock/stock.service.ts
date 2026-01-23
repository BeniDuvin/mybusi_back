import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockMovementType } from '@prisma/client';
import { StockMovementDto, StockAdjustmentDto } from './dto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async getStock(productId: string, depotId: string) {
    const stock = await this.prisma.stock.findUnique({
      where: {
        productId_depotId: {
          productId,
          depotId,
        },
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
          },
        },
        depot: true,
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    return stock;
  }

  async getStockByDepot(depotId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [stocks, total] = await Promise.all([
      this.prisma.stock.findMany({
        where: { depotId },
        skip,
        take: limit,
        include: {
          product: {
            include: {
              category: true,
              brand: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.stock.count({ where: { depotId } }),
    ]);

    return {
      data: stocks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addStock(dto: StockMovementDto) {
    const { productId, depotId, quantity, reason, reference } = dto;

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const stock = await this.prisma.stock.findUnique({
      where: {
        productId_depotId: {
          productId,
          depotId,
        },
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    const [updatedStock] = await this.prisma.$transaction([
      this.prisma.stock.update({
        where: { id: stock.id },
        data: {
          quantity: {
            increment: quantity,
          },
        },
        include: {
          product: true,
        },
      }),
      this.prisma.stockMovement.create({
        data: {
          stockId: stock.id,
          type: StockMovementType.IN,
          quantity,
          reason,
          reference,
        },
      }),
    ]);

    return updatedStock;
  }

  async removeStock(dto: StockMovementDto) {
    const { productId, depotId, quantity, reason, reference } = dto;

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const stock = await this.prisma.stock.findUnique({
      where: {
        productId_depotId: {
          productId,
          depotId,
        },
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    if (stock.quantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const [updatedStock] = await this.prisma.$transaction([
      this.prisma.stock.update({
        where: { id: stock.id },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
        include: {
          product: true,
        },
      }),
      this.prisma.stockMovement.create({
        data: {
          stockId: stock.id,
          type: StockMovementType.OUT,
          quantity,
          reason,
          reference,
        },
      }),
    ]);

    return updatedStock;
  }

  async adjustStock(dto: StockAdjustmentDto) {
    const { productId, depotId, newQuantity, reason } = dto;

    if (newQuantity < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }

    const stock = await this.prisma.stock.findUnique({
      where: {
        productId_depotId: {
          productId,
          depotId,
        },
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    const difference = newQuantity - stock.quantity;

    const [updatedStock] = await this.prisma.$transaction([
      this.prisma.stock.update({
        where: { id: stock.id },
        data: {
          quantity: newQuantity,
        },
        include: {
          product: true,
        },
      }),
      this.prisma.stockMovement.create({
        data: {
          stockId: stock.id,
          type: StockMovementType.ADJUSTMENT,
          quantity: Math.abs(difference),
          reason: reason || `Adjustment from ${stock.quantity} to ${newQuantity}`,
        },
      }),
    ]);

    return updatedStock;
  }

  async getStockMovements(stockId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where: { stockId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where: { stockId } }),
    ]);

    return {
      data: movements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLowStockAlert(depotId?: string) {
    const stocks = await this.prisma.stock.findMany({
      where: depotId ? { depotId } : {},
      include: {
        product: {
          include: {
            category: true,
            brand: true,
          },
        },
        depot: true,
      },
    });

    const lowStocks = stocks.filter((stock) => stock.quantity <= stock.product.minStock);

    return lowStocks;
  }
}
