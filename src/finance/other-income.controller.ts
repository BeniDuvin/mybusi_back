import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OtherIncomeService } from './other-income.service';
import { CreateOtherIncomeDto, UpdateOtherIncomeDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';

@ApiTags('Other Incomes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('other-incomes')
export class OtherIncomeController {
  constructor(private otherIncomeService: OtherIncomeService) {}

  @Post()
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Create a new other income entry' })
  create(@Body() dto: CreateOtherIncomeDto, @GetUser() user: User) {
    return this.otherIncomeService.create(dto, user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Get all other income entries' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'depotId', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAll(@Query() query: any) {
    const { page, limit, ...filters } = query;
    return this.otherIncomeService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      filters,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Get an other income entry by ID' })
  findOne(@Param('id') id: string) {
    return this.otherIncomeService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Update an other income entry' })
  update(@Param('id') id: string, @Body() dto: UpdateOtherIncomeDto) {
    return this.otherIncomeService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an other income entry' })
  remove(@Param('id') id: string) {
    return this.otherIncomeService.remove(id);
  }
}
