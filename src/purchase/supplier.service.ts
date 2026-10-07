import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    const { phone, email } = dto;

    if (phone) {
      const existingPhone = await this.prisma.supplier.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    if (email) {
      const existingEmail = await this.prisma.supplier.findUnique({ where: { email } });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    return this.prisma.supplier.create({
      data: dto,
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string, depotId?: string) {
    const skip = (page - 1) * limit;

    const where = {
      depotId,
      ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    };

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              purchases: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          include: {
            lines: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);

    if (dto.phone) {
      const existingPhone = await this.prisma.supplier.findFirst({
        where: {
          phone: dto.phone,
          NOT: { id },
        },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    if (dto.email) {
      const existingEmail = await this.prisma.supplier.findFirst({
        where: {
          email: dto.email,
          NOT: { id },
        },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}
