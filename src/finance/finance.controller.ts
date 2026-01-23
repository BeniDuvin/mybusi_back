import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('summary')
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiQuery({ name: 'depotId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getSummary(
    @Query('depotId') depotId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getFinancialSummary(
      depotId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('cashflow')
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Get cash flow report' })
  @ApiQuery({ name: 'depotId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getCashFlow(
    @Query('depotId') depotId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getCashFlow(
      depotId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiQuery({ name: 'depotId', required: false, type: String })
  getDashboard(@Query('depotId') depotId?: string) {
    return this.financeService.getDashboardStats(depotId);
  }
}
