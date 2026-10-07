import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto';
import { PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    const { saleId, clientId, amount, method, mobileMoneyProvider, mobileMoneyNumber, reference, notes } = dto;

    if (saleId) {
      const sale = await this.prisma.sale.findUnique({ where: { id: saleId } });
      if (!sale) {
        throw new NotFoundException(`Sale with ID ${saleId} not found`);
      }

      if (amount > sale.remainingAmount) {
        throw new BadRequestException('Payment amount exceeds remaining balance');
      }
    }

    if (clientId) {
      const client = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (!client) {
        throw new NotFoundException(`Client with ID ${clientId} not found`);
      }
    }

    let transactionId: string | null = null;
    let status: PaymentStatus = PaymentStatus.PENDING;

    if (method === PaymentMethod.CASH) {
      status = PaymentStatus.COMPLETED;
    } else if (method === PaymentMethod.MOBILE_MONEY) {
      const mobileMoneyResult = await this.processMobileMoneyPayment({
        amount,
        phoneNumber: mobileMoneyNumber,
        provider: mobileMoneyProvider,
        reference,
      });
      
      transactionId = mobileMoneyResult.transactionId;
      status = mobileMoneyResult.status;
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          saleId,
          clientId,
          amount,
          method,
          status,
          mobileMoneyProvider,
          mobileMoneyNumber,
          transactionId,
          reference,
          notes,
        },
        include: {
          sale: true,
          client: true,
        },
      });

      if (saleId && status === PaymentStatus.COMPLETED) {
        await this.updateSaleTotals(tx, saleId);
      }

      if (clientId && status === PaymentStatus.COMPLETED && !saleId) {
        await tx.client.update({
          where: { id: clientId },
          data: {
            totalDebt: {
              decrement: amount,
            },
          },
        });
      }

      return createdPayment;
    });

    return payment;
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.saleId || filters?.depotId) {
      where.sale = {
        ...(filters.saleId ? { id: filters.saleId } : {}),
        ...(filters.depotId ? { depotId: filters.depotId } : {}),
      };
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.method) {
      where.method = filters.method;
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

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          sale: true,
          client: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            lines: {
              include: {
                product: true,
              },
            },
          },
        },
        client: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async verifyMobileMoneyPayment(id: string) {
    const payment = await this.findOne(id);

    if (payment.method !== PaymentMethod.MOBILE_MONEY) {
      throw new BadRequestException('Payment is not a mobile money payment');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed');
    }

    const verificationResult = await this.checkMobileMoneyStatus(payment.transactionId!);

    if (verificationResult.status === PaymentStatus.COMPLETED) {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id },
          data: {
            status: PaymentStatus.COMPLETED,
          },
        });

        if (payment.saleId) {
          await this.updateSaleTotals(tx, payment.saleId);
        }
      });

      return { message: 'Payment verified and completed' };
    }

    return { message: 'Payment still pending', status: verificationResult.status };
  }

  private async processMobileMoneyPayment(data: any) {
    console.log('Processing mobile money payment:', data);
    
    return {
      transactionId: `MM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: PaymentStatus.PENDING,
    };
  }

  private async checkMobileMoneyStatus(transactionId: string) {
    console.log('Checking mobile money status for:', transactionId);
    
    return {
      status: PaymentStatus.COMPLETED,
    };
  }

  private async updateSaleTotals(tx: Prisma.TransactionClient, saleId: string) {
    const sale = await tx.sale.findUnique({ where: { id: saleId } });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${saleId} not found`);
    }

    const completedPayments = await tx.payment.aggregate({
      where: { saleId, status: PaymentStatus.COMPLETED },
      _sum: { amount: true },
    });

    const paidAmount = completedPayments._sum.amount ?? 0;
    const remainingAmount = Math.max(0, sale.totalAmount - paidAmount);

    await tx.sale.update({
      where: { id: saleId },
      data: {
        paidAmount,
        remainingAmount,
        status: remainingAmount === 0 ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
      },
    });
  }
}
