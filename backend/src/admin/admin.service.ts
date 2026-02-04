import { BadRequestException, Injectable } from '@nestjs/common';
import { OrganizationType, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async bootstrapSystemAdmin(params: { name: string; email: string; password: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: params.email } });
    if (existing) {
      throw new BadRequestException('Admin already exists');
    }

    const passwordHash = await bcrypt.hash(params.password, 10);
    return this.prisma.user.create({
      data: {
        name: params.name,
        email: params.email,
        passwordHash,
        role: Role.SYSTEM_ADMIN
      },
      select: { id: true, name: true, email: true, role: true }
    });
  }

  async listOrganizations() {
    const organizations = await this.prisma.organization.findMany({
      include: {
        purchases: { orderBy: { purchasedAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });

    const results = await Promise.all(
      organizations.map(async (organization) => {
        const userCount = await this.prisma.user.count({
          where: { organizationId: organization.id }
        });

        return {
          ...organization,
          userCount
        };
      })
    );

    return results;
  }

  async listPurchases() {
    return this.prisma.packagePurchase.findMany({
      include: {
        organization: true,
        purchasedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { purchasedAt: 'desc' }
    });
  }

  async getPricing() {
    return this.prisma.packagePrice.findMany({ orderBy: { packageType: 'asc' } });
  }

  async updatePricing(params: { packageType: OrganizationType; amount: number; currency?: string }) {
    return this.prisma.packagePrice.upsert({
      where: { packageType: params.packageType },
      create: {
        packageType: params.packageType,
        amount: params.amount,
        currency: params.currency ?? 'INR'
      },
      update: {
        amount: params.amount,
        currency: params.currency ?? 'INR'
      }
    });
  }
}
