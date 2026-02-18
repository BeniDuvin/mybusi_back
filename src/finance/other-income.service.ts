import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOtherIncomeDto, UpdateOtherIncomeDto } from './dto';

@Injectable()
export class OtherIncomeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOtherIncomeDto, userId: string) {
    const otherIncome = await this.prisma.otherIncome.create({
      data: {
        ...dto,
        userId,
      },
      include: {
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

    await this.prisma.financialTransaction.create({
      data: {
        type: 'INCOME',
        category: dto.category,
        amount: dto.amount,
        description: dto.description,
        reference: dto.reference,
      },
    });

    return otherIncome;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.depotId) {
      where.depotId = filters.depotId;
    }

    if (filters?.category) {
      where.category = filters.category;
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

    const [otherIncomes, total] = await Promise.all([
      this.prisma.otherIncome.findMany({
        where,
        skip,
        take: limit,
        include: {
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
      this.prisma.otherIncome.count({ where }),
    ]);

    return {
      data: otherIncomes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const otherIncome = await this.prisma.otherIncome.findUnique({
      where: { id },
      include: {
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

    if (!otherIncome) {
      throw new NotFoundException(`Other income with ID ${id} not found`);
    }

    return otherIncome;
  }

  async update(id: string, dto: UpdateOtherIncomeDto) {
    await this.findOne(id);

    return this.prisma.otherIncome.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.otherIncome.delete({
      where: { id },
    });
  }
}
