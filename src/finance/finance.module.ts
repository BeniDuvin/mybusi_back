import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { SalaryController } from './salary.controller';
import { SalaryService } from './salary.service';

@Module({
  controllers: [FinanceController, ExpenseController, SalaryController],
  providers: [FinanceService, ExpenseService, SalaryService],
  exports: [FinanceService, ExpenseService, SalaryService],
})
export class FinanceModule {}
