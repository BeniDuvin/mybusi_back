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
import { DepotService } from './depot.service';
import { CreateDepotDto, UpdateDepotDto, AssignUserToDepotDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Depots')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('depots')
export class DepotController {
  constructor(private depotService: DepotService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new depot' })
  @ApiResponse({ status: 201, description: 'Depot created successfully' })
  create(@Body() dto: CreateDepotDto) {
    return this.depotService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all depots with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.depotService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a depot by ID' })
  @ApiResponse({ status: 200, description: 'Depot found' })
  @ApiResponse({ status: 404, description: 'Depot not found' })
  findOne(@Param('id') id: string) {
    return this.depotService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a depot' })
  @ApiResponse({ status: 200, description: 'Depot updated successfully' })
  update(@Param('id') id: string, @Body() dto: UpdateDepotDto) {
    return this.depotService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a depot' })
  @ApiResponse({ status: 200, description: 'Depot deleted successfully' })
  remove(@Param('id') id: string) {
    return this.depotService.remove(id);
  }

  @Post('assign-user')
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Assign a user to a depot' })
  @ApiResponse({ status: 201, description: 'User assigned successfully' })
  assignUser(@Body() dto: AssignUserToDepotDto) {
    return this.depotService.assignUser(dto);
  }

  @Delete(':depotId/users/:userId')
  @Roles(Role.ADMIN, Role.GERANT)
  @ApiOperation({ summary: 'Remove a user from a depot' })
  @ApiResponse({ status: 200, description: 'User removed successfully' })
  removeUser(@Param('userId') userId: string, @Param('depotId') depotId: string) {
    return this.depotService.removeUserFromDepot(userId, depotId);
  }
}
