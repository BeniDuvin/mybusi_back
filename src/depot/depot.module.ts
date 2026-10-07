import { Module } from '@nestjs/common';
import { DepotController } from './depot.controller';
import { DepotService } from './depot.service';
import { StoreContextGuard } from './store-context.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DepotController],
  providers: [DepotService, StoreContextGuard],
  exports: [DepotService, StoreContextGuard],
})
export class DepotModule {}
