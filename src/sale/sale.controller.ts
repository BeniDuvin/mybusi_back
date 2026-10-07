import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SaleService } from './sale.service';
import { CreateSaleDto, UpdateSaleDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { StoreContextGuard } from '../depot/store-context.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), StoreContextGuard)
@Controller('sales')
export class SaleController {
  constructor(private saleService: SaleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  create(@Body() dto: CreateSaleDto, @GetUser() user: User) {
    return this.saleService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'depotId', required: false, type: String })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAll(@Query() query: any) {
    const { page, limit, ...filters } = query;
    return this.saleService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      filters,
    );
  }

  @Get('report')
  @ApiOperation({ summary: 'Get sales report' })
  @ApiQuery({ name: 'depotId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getReport(
    @Query('depotId') depotId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.saleService.getSalesReport(
      depotId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sale by ID' })
  findOne(@Param('id') id: string) {
    return this.saleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sale' })
  update(@Param('id') id: string, @Body() dto: UpdateSaleDto) {
    return this.saleService.update(id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a sale' })
  cancel(@Param('id') id: string) {
    return this.saleService.cancelSale(id);
  }
}
