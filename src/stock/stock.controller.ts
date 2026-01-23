import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { StockMovementDto, StockAdjustmentDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private stockService: StockService) {}

  @Get(':productId/:depotId')
  @ApiOperation({ summary: 'Get stock for a product in a depot' })
  getStock(@Param('productId') productId: string, @Param('depotId') depotId: string) {
    return this.stockService.getStock(productId, depotId);
  }

  @Get('depot/:depotId')
  @ApiOperation({ summary: 'Get all stocks for a depot' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getStockByDepot(
    @Param('depotId') depotId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stockService.getStockByDepot(
      depotId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Post('add')
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Add stock to a product' })
  @ApiResponse({ status: 201, description: 'Stock added successfully' })
  addStock(@Body() dto: StockMovementDto) {
    return this.stockService.addStock(dto);
  }

  @Post('remove')
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Remove stock from a product' })
  @ApiResponse({ status: 201, description: 'Stock removed successfully' })
  removeStock(@Body() dto: StockMovementDto) {
    return this.stockService.removeStock(dto);
  }

  @Post('adjust')
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Adjust stock quantity' })
  @ApiResponse({ status: 201, description: 'Stock adjusted successfully' })
  adjustStock(@Body() dto: StockAdjustmentDto) {
    return this.stockService.adjustStock(dto);
  }

  @Get('movements/:stockId')
  @ApiOperation({ summary: 'Get stock movement history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMovements(
    @Param('stockId') stockId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stockService.getStockMovements(
      stockId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('alerts/low-stock')
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiQuery({ name: 'depotId', required: false, type: String })
  getLowStockAlerts(@Query('depotId') depotId?: string) {
    return this.stockService.getLowStockAlert(depotId);
  }
}
