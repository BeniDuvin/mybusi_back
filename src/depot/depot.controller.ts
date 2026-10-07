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
import { CreateDepotDto, UpdateDepotDto, AssignUserToDepotDto, InviteMemberDto } from './dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { StoreMemberRole } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdateMemberRoleDto {
  @ApiProperty({ enum: StoreMemberRole })
  @IsEnum(StoreMemberRole)
  role: StoreMemberRole;
}

@ApiTags('Stores')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller(['stores', 'depots'])
export class DepotController {
  constructor(private depotService: DepotService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new depot' })
  @ApiResponse({ status: 201, description: 'Depot created successfully' })
  create(@Body() dto: CreateDepotDto, @GetUser() user: User) {
    return this.depotService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all depots with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('search') search: string | undefined,
    @GetUser() user: User,
  ) {
    return this.depotService.findAll(
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a depot by ID' })
  @ApiResponse({ status: 200, description: 'Depot found' })
  @ApiResponse({ status: 404, description: 'Depot not found' })
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.depotService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a depot' })
  @ApiResponse({ status: 200, description: 'Depot updated successfully' })
  update(@Param('id') id: string, @Body() dto: UpdateDepotDto, @GetUser() user: User) {
    return this.depotService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a depot' })
  @ApiResponse({ status: 200, description: 'Depot deleted successfully' })
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.depotService.remove(id, user.id);
  }

  @Get(':id/members')
  listMembers(@Param('id') id: string, @GetUser() user: User) {
    return this.depotService.listMembers(id, user.id);
  }

  @Post(':id/members/invite')
  @ApiOperation({ summary: 'Invite a member by email' })
  inviteMember(@Param('id') id: string, @Body() dto: InviteMemberDto, @GetUser() user: User) {
    return this.depotService.inviteMember(id, dto, user.id);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AssignUserToDepotDto, @GetUser() user: User) {
    return this.depotService.assignUser({ ...dto, depotId: id }, user.id);
  }

  @Patch(':id/members/:userId')
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @GetUser() user: User,
  ) {
    return this.depotService.setMemberRole(id, userId, dto.role, user.id);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @GetUser() user: User) {
    return this.depotService.removeUserFromDepot(userId, id, user.id);
  }

  @Get(':id/subscription')
  getSubscription(@Param('id') id: string, @GetUser() user: User) {
    return this.depotService.getSubscription(id, user.id);
  }

  @Post('assign-user')
  @ApiOperation({ summary: 'Assign a user to a depot' })
  @ApiResponse({ status: 201, description: 'User assigned successfully' })
  assignUser(@Body() dto: AssignUserToDepotDto, @GetUser() user: User) {
    return this.depotService.assignUser(dto, user.id);
  }

  @Delete(':depotId/users/:userId')
  @ApiOperation({ summary: 'Remove a user from a depot' })
  @ApiResponse({ status: 200, description: 'User removed successfully' })
  removeUser(@Param('userId') userId: string, @Param('depotId') depotId: string, @GetUser() user: User) {
    return this.depotService.removeUserFromDepot(userId, depotId, user.id);
  }
}
