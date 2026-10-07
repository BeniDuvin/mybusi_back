import { Module } from '@nestjs/common';
import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { DepotModule } from '../depot/depot.module';

@Module({
  imports: [DepotModule],
  controllers: [PurchaseController, SupplierController],
  providers: [PurchaseService, SupplierService],
  exports: [PurchaseService, SupplierService],
})
export class PurchaseModule {}
