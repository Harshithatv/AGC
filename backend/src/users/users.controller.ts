import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { BulkUsersDto } from './dto/bulk-users.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.ORG_ADMIN)
  async listUsers(@CurrentUser() user: { organizationId?: string }) {
    return this.usersService.listByOrganization(user.organizationId as string);
  }

  @Post()
  @Roles(Role.ORG_ADMIN)
  async createUser(
    @CurrentUser() user: { organizationId?: string },
    @Body() body: CreateUserDto
  ) {
    return this.usersService.createUser({
      organizationId: user.organizationId as string,
      name: body.name,
      email: body.email,
      password: body.password
    });
  }

  @Post('bulk')
  @Roles(Role.ORG_ADMIN)
  async bulkCreate(
    @CurrentUser() user: { organizationId?: string },
    @Body() body: BulkUsersDto
  ) {
    return this.usersService.bulkCreateUsers({
      organizationId: user.organizationId as string,
      users: body.users
    });
  }
}
