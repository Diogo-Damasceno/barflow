import { Body, Controller, Get, Param, Post, Put, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserRoleDto, CreateRoleDto } from './dto/user.dto';
import { JwtAuthGuard, PermissionsGuard } from '../shared/guards';
import { Require } from '../shared/permissions.decorator';
import { User, AuthUser } from '../shared/user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Require('user:create')
  @Post()
  create(@Body() dto: CreateUserDto, @User() u: AuthUser) {
    return this.users.create(dto, u.tenantId, u.id);
  }

  @Require('user:read')
  @Get()
  list(@User() u: AuthUser) {
    return this.users.list(u.tenantId);
  }

  @Require('user:update')
  @Put(':id/role')
  setRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto, @User() u: AuthUser) {
    return this.users.setRole(id, dto, u.tenantId, u.id);
  }

  @Require('user:delete')
  @Delete(':id')
  remove(@Param('id') id: string, @User() u: AuthUser) {
    return this.users.remove(id, u.tenantId);
  }

  @Require('role:create')
  @Post('roles')
  createRole(@Body() dto: CreateRoleDto, @User() u: AuthUser) {
    return this.users.createRole(dto, u.tenantId);
  }

  @Require('role:read')
  @Get('roles')
  roles(@User() u: AuthUser) {
    return this.users.listRoles(u.tenantId);
  }
}
