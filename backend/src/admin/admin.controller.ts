import { Body, Controller, Get, Headers, Post, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { AdminService } from './admin.service';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('bootstrap')
  async bootstrap(@Headers('x-bootstrap-key') key: string, @Body() body: BootstrapAdminDto) {
    const expected = process.env.BOOTSTRAP_KEY || 'bootstrap-me';
    if (key !== expected) {
      return { message: 'Invalid bootstrap key' };
    }

    return this.adminService.bootstrapSystemAdmin({
      name: body.name,
      email: body.email,
      password: body.password
    });
  }

  @Get('organizations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async listOrganizations() {
    return this.adminService.listOrganizations();
  }

  @Get('purchases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async listPurchases() {
    return this.adminService.listPurchases();
  }

  @Get('pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async listPricing() {
    return this.adminService.getPricing();
  }

  @Put('pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async updatePricing(@Body() body: UpdatePricingDto) {
    return this.adminService.updatePricing({
      packageType: body.packageType,
      amount: body.amount,
      currency: body.currency
    });
  }
}
