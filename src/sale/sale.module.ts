import { Module } from '@nestjs/common';
import { SaleController } from './sale.controller';
import { SaleService } from './sale.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { StockModule } from '../stock/stock.module';
import { DepotModule } from '../depot/depot.module';

@Module({
  imports: [StockModule, DepotModule],
  controllers: [SaleController, PaymentController],
  providers: [SaleService, PaymentService],
  exports: [SaleService, PaymentService],
})
export class SaleModule {}
