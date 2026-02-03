import { BadRequestException, Injectable } from '@nestjs/common';
import { OrganizationType, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

const MAX_USERS_BY_TYPE: Record<OrganizationType, number> = {
  [OrganizationType.SINGLE]: 1,
  [OrganizationType.GROUP]: 5,
  [OrganizationType.INSTITUTION]: 10
};

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async getPricing() {
    return this.prisma.packagePrice.findMany({ orderBy: { packageType: 'asc' } });
  }

  async createPurchase(params: {
    packageType: OrganizationType;
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

    if (params.packageType === OrganizationType.INSTITUTION) {
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
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          type: params.packageType,
          maxUsers: MAX_USERS_BY_TYPE[params.packageType],
          startDate: new Date()
        }
      });

      const assignedRole =
        params.packageType === OrganizationType.SINGLE ? Role.ORG_USER : Role.ORG_ADMIN;

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
