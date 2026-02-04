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
    console.warn('CreateUser payload types', {
      nameType: typeof body?.name,
      emailType: typeof body?.email,
      passwordType: typeof body?.password,
      nameLength: body?.name?.length ?? null,
      emailLength: body?.email?.length ?? null,
      passwordLength: body?.password?.length ?? null
    });
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
    console.warn('BulkCreate payload summary', {
      total: body?.users?.length ?? 0,
      first: body?.users?.[0]
        ? {
            nameType: typeof body.users[0].name,
            emailType: typeof body.users[0].email,
            passwordType: typeof body.users[0].password,
            nameLength: body.users[0].name?.length ?? null,
            emailLength: body.users[0].email?.length ?? null,
            passwordLength: body.users[0].password?.length ?? null
          }
        : null
    });
    return this.usersService.bulkCreateUsers({
      organizationId: user.organizationId as string,
      users: body.users
    });
  }
}
