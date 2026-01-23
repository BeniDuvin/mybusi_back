import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalaryService } from './salary.service';
import { CreateSalaryPaymentDto, UpdateSalaryPaymentDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Salaries')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('salaries')
export class SalaryController {
  constructor(private salaryService: SalaryService) {}

  @Post()
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Create a new salary payment' })
  create(@Body() dto: CreateSalaryPaymentDto) {
    return this.salaryService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Get all salary payments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'period', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAll(@Query() query: any) {
    const { page, limit, ...filters } = query;
    return this.salaryService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      filters,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Get a salary payment by ID' })
  findOne(@Param('id') id: string) {
    return this.salaryService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a salary payment' })
  update(@Param('id') id: string, @Body() dto: UpdateSalaryPaymentDto) {
    return this.salaryService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a salary payment' })
  remove(@Param('id') id: string) {
    return this.salaryService.remove(id);
  }
}
