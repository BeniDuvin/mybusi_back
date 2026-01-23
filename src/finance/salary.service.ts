import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalaryPaymentDto, UpdateSalaryPaymentDto } from './dto';

@Injectable()
export class SalaryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSalaryPaymentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    const salary = await this.prisma.salaryPayment.create({
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    await this.prisma.financialTransaction.create({
      data: {
        type: 'EXPENSE',
        category: 'Salary',
        amount: dto.amount,
        description: `Salary payment for ${user.firstName} ${user.lastName} - ${dto.period}`,
        reference: salary.id,
      },
    });

    return salary;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.period) {
      where.period = filters.period;
    }

    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.paymentDate.lte = new Date(filters.endDate);
      }
    }

    const [salaries, total] = await Promise.all([
      this.prisma.salaryPayment.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.salaryPayment.count({ where }),
    ]);

    return {
      data: salaries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const salary = await this.prisma.salaryPayment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!salary) {
      throw new NotFoundException(`Salary payment with ID ${id} not found`);
    }

    return salary;
  }

  async update(id: string, dto: UpdateSalaryPaymentDto) {
    await this.findOne(id);

    return this.prisma.salaryPayment.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.salaryPayment.delete({
      where: { id },
    });
  }
}
