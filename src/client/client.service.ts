import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    const { phone, email } = dto;

    if (phone) {
      const existingPhone = await this.prisma.client.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    if (email) {
      const existingEmail = await this.prisma.client.findUnique({ where: { email } });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    return this.prisma.client.create({
      data: dto,
    });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              sales: true,
              payments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data: clients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
            lines: {
              include: {
                product: true,
              },
            },
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            sales: true,
            payments: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);

    if (dto.phone) {
      const existingPhone = await this.prisma.client.findFirst({
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
      const existingEmail = await this.prisma.client.findFirst({
        where: {
          email: dto.email,
          NOT: { id },
        },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.client.delete({
      where: { id },
    });
  }

  async getClientStats(id: string) {
    const client = await this.findOne(id);

    const sales = await this.prisma.sale.findMany({
      where: { clientId: id },
      include: {
        payments: true,
      },
    });

    const totalSales = sales.length;
    const totalSpent = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPaid = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
    const totalDebt = client.totalDebt;

    return {
      client,
      stats: {
        totalSales,
        totalSpent,
        totalPaid,
        totalDebt,
      },
    };
  }
}
