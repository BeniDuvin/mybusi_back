import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const depotId = dto.depotId || dto.depotid;
    if (!depotId) {
      throw new BadRequestException('depotId is required');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
    }

    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: dto.brandId },
      });
      if (!brand) {
        throw new NotFoundException(`Brand with ID ${dto.brandId} not found`);
      }
    }

    const depot = await this.prisma.depot.findUnique({
      where: { id: depotId },
    });
    if (!depot) {
      throw new NotFoundException(`Depot with ID ${depotId} not found`);
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        barcode: dto.barcode,
        sku: dto.sku,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
        depotId,
        purchasePrice: dto.purchasePrice,
        sellingPrice: dto.sellingPrice,
        minStock: dto.minStock,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive,
      },
      include: {
        category: true,
        brand: true,
        depot: true,
      },
    });

    await this.prisma.stock.create({
      data: {
        productId: product.id,
        depotId,
        quantity: 0,
      },
    });

    return product;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' as const } },
        { description: { contains: filters.search, mode: 'insensitive' as const } },
        { barcode: { contains: filters.search, mode: 'insensitive' as const } },
        { sku: { contains: filters.search, mode: 'insensitive' as const } },
      ];
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.brandId) {
      where.brandId = filters.brandId;
    }

    if (filters?.depotId) {
      where.depotId = filters.depotId;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive === 'true';
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          brand: true,
          depot: true,
          stocks: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        depot: true,
        stocks: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
      }
    }

    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: dto.brandId },
      });
      if (!brand) {
        throw new NotFoundException(`Brand with ID ${dto.brandId} not found`);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: {
        category: true,
        brand: true,
        depot: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Produit lié à des achats/ventes; utilisez la désactivation.',
        );
      }
      throw error;
    }
  }

  async getLowStockProducts(depotId?: string) {
    const products = await this.prisma.product.findMany({
      where: depotId ? { depotId } : undefined,
      include: {
        category: true,
        brand: true,
        stocks: true,
      },
    });

    return products.filter((product) =>
      product.stocks.some((stock) => stock.quantity <= product.minStock),
    );
  }
}
