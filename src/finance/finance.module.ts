import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { SalaryController } from './salary.controller';
import { SalaryService } from './salary.service';
import { OtherIncomeController } from './other-income.controller';
import { OtherIncomeService } from './other-income.service';

@Module({
  controllers: [FinanceController, ExpenseController, SalaryController, OtherIncomeController],
  providers: [FinanceService, ExpenseService, SalaryService, OtherIncomeService],
  exports: [FinanceService, ExpenseService, SalaryService, OtherIncomeService],
})
export class FinanceModule {}
