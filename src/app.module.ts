import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DepotModule } from './depot/depot.module';
import { ProductModule } from './product/product.module';
import { StockModule } from './stock/stock.module';
import { SaleModule } from './sale/sale.module';
import { ClientModule } from './client/client.module';
import { PurchaseModule } from './purchase/purchase.module';
import { FinanceModule } from './finance/finance.module';
import { LogModule } from './log/log.module';
import { InvoiceModule } from './invoice/invoice.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    DepotModule,
    ProductModule,
    StockModule,
    SaleModule,
    ClientModule,
    PurchaseModule,
    FinanceModule,
    LogModule,
    InvoiceModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
