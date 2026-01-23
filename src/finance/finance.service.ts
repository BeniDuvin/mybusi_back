import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, PaymentStatus } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getFinancialSummary(depotId?: string, startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = startDate;
      }
      if (endDate) {
        dateFilter.createdAt.lte = endDate;
      }
    }

    const salesFilter = { ...dateFilter };
    if (depotId) {
      salesFilter.depotId = depotId;
    }

    const [sales, purchases, expenses, salaries] = await Promise.all([
      this.prisma.sale.findMany({
        where: { ...salesFilter, status: PaymentStatus.COMPLETED },
      }),
      this.prisma.purchase.findMany({
        where: { ...salesFilter },
      }),
      this.prisma.expense.findMany({
        where: { ...(depotId ? { depotId, ...dateFilter } : dateFilter) },
      }),
      this.prisma.salaryPayment.findMany({
        where: dateFilter,
      }),
    ]);

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
    const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalSalaries = salaries.reduce((sum, salary) => sum + salary.amount, 0);

    const totalIncome = totalRevenue;
    const totalOutcome = totalPurchases + totalExpenses + totalSalaries;
    const netProfit = totalIncome - totalOutcome;

    return {
      income: {
        sales: totalRevenue,
        total: totalIncome,
      },
      expenses: {
        purchases: totalPurchases,
        expenses: totalExpenses,
        salaries: totalSalaries,
        total: totalOutcome,
      },
      netProfit,
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }

  async getCashFlow(depotId?: string, startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) {
        dateFilter.date.gte = startDate;
      }
      if (endDate) {
        dateFilter.date.lte = endDate;
      }
    }

    const transactions = await this.prisma.financialTransaction.findMany({
      where: dateFilter,
      orderBy: { date: 'desc' },
    });

    const income = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      transactions,
      summary: {
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
      },
    };
  }

  async getDashboardStats(depotId?: string) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const salesFilter = depotId ? { depotId } : {};

    const [todaySales, monthSales, totalClients, totalProducts, lowStockCount] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          ...salesFilter,
          createdAt: { gte: startOfDay },
        },
      }),
      this.prisma.sale.findMany({
        where: {
          ...salesFilter,
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.client.count(),
      this.prisma.product.count(depotId ? { where: { depotId } } : undefined),
      this.prisma.stock.count({
        where: {
          ...(depotId ? { depotId } : {}),
          quantity: { lte: 10 },
        },
      }),
    ]);

    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    return {
      today: {
        sales: todaySales.length,
        revenue: todayRevenue,
      },
      month: {
        sales: monthSales.length,
        revenue: monthRevenue,
      },
      totals: {
        clients: totalClients,
        products: totalProducts,
        lowStockItems: lowStockCount,
      },
    };
  }
}
