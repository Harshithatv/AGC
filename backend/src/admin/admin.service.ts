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
    const modules = await this.prisma.courseModule.findMany({
      orderBy: { order: 'asc' }
    });

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

        const moduleDeadlines = modules.map((moduleItem) => {
          const deadline = new Date(organization.startDate);
          deadline.setDate(deadline.getDate() + moduleItem.deadlineDays * moduleItem.order);

          return {
            id: moduleItem.id,
            title: moduleItem.title,
            order: moduleItem.order,
            deadline
          };
        });

        return {
          ...organization,
          userCount,
          moduleDeadlines
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
      update: { amount: params.amount, currency: params.currency ?? 'INR' },
      create: { packageType: params.packageType, amount: params.amount, currency: params.currency ?? 'INR' }
    });
  }
}
