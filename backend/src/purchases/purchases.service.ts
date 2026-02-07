import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

const MAX_USERS_BY_TYPE: Record<string, number> = {
  SINGLE: 1,
  GROUP: 5,
  INSTITUTION: 10
};

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async getPricing() {
    return this.prisma.packagePrice.findMany({ orderBy: { packageType: 'asc' } });
  }

  async createPurchase(params: {
    packageType: string;
    organizationName: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    instituteName?: string;
    roleAtSchool?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: params.adminEmail }
    });

    if (existing) {
      throw new BadRequestException('Admin email already in use');
    }

    let organizationName = params.organizationName;
    let adminName = params.adminName;

    if (params.packageType === 'INSTITUTION') {
      if (!params.instituteName) {
        throw new BadRequestException('Institute name is required for institution packages');
      }
      organizationName = params.instituteName;
      if (params.roleAtSchool && !adminName.includes(params.roleAtSchool)) {
        adminName = `${adminName} (${params.roleAtSchool})`;
      }
    }

    const passwordHash = await bcrypt.hash(params.adminPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      const price = await tx.packagePrice.findUnique({
        where: { packageType: params.packageType }
      });

      if (!price && !MAX_USERS_BY_TYPE[params.packageType]) {
        throw new BadRequestException('Package not found');
      }

      const maxUsers = price?.maxUsers ?? MAX_USERS_BY_TYPE[params.packageType] ?? 1;

      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          type: params.packageType,
          maxUsers,
          startDate: new Date()
        }
      });

      const assignedRole = maxUsers <= 1 ? Role.ORG_USER : Role.ORG_ADMIN;

      const admin = await tx.user.create({
        data: {
          name: adminName,
          email: params.adminEmail,
          passwordHash,
          role: assignedRole,
          organizationId: organization.id
        }
      });

      const purchase = await tx.packagePurchase.create({
        data: {
          packageType: params.packageType,
          organizationId: organization.id,
          purchasedById: admin.id
        }
      });

      return {
        purchase,
        organization,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      };
    });
  }
}
