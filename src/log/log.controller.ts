import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LogService } from './log.service';
import { StoreContextGuard } from '../depot/store-context.guard';

@ApiTags('Logs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), StoreContextGuard)
@Controller('logs')
export class LogController {
  constructor(private logService: LogService) {}

  @Get()
  @ApiOperation({ summary: 'Get all logs with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'depotId', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAll(@Query() query: any) {
    const { page, limit, ...filters } = query;
    return this.logService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      filters,
    );
  }
}
