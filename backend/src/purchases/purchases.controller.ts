import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
export class PurchasesController {
  constructor(private purchasesService: PurchasesService) {}

  @Get('pricing')
  async pricing() {
    return this.purchasesService.getPricing();
  }

  @Post()
  async create(@Body() body: CreatePurchaseDto) {
    return this.purchasesService.createPurchase({
      packageType: body.packageType,
      organizationName: body.organizationName,
      adminName: body.adminName,
      adminEmail: body.adminEmail,
      adminPassword: body.adminPassword,
      instituteName: body.instituteName,
      roleAtSchool: body.roleAtSchool
    });
  }
}
