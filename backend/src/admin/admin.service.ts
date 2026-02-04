import { BadRequestException, Injectable } from '@nestjs/common';
import { OrganizationType, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ModulesService } from '../modules/modules.service';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private modulesService: ModulesService,
    private progressService: ProgressService
  ) {}

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
          where: { organizationId: organization.id, role: Role.ORG_USER }
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

  async getOrganization(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        purchases: { orderBy: { purchasedAt: 'desc' }, take: 1 }
      }
    });
  }

  async listOrganizationUsersWithProgress(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId, role: Role.ORG_USER },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    const usersWithProgress = await Promise.all(
      users.map(async (user) => {
        const summary = await this.progressService.getCompletionSummary(user.id);
        return {
          ...user,
          progress: summary,
          certificate: summary.allCompleted
            ? {
                issuedTo: user.name,
                issuedEmail: user.email,
                issuedAt: summary.issuedAt ?? new Date(),
                program: 'Academic Guide Course & Certification'
              }
            : null
        };
      })
    );

    return usersWithProgress;
  }

  async getUserProgressDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, organizationId: true }
    });

    if (!user?.organizationId) {
      return null;
    }

    const [organization, modules, summary] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: user.organizationId } }),
      this.modulesService.getModulesForUser(user.id, user.organizationId),
      this.progressService.getCompletionSummary(user.id)
    ]);

    const lastCompleted = [...modules]
      .filter((moduleItem) => moduleItem.status === 'COMPLETED')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .pop();

    return {
      user,
      organization,
      modules,
      progress: summary,
      lastCompletedModule: lastCompleted
        ? { id: lastCompleted.id, title: lastCompleted.title, order: lastCompleted.order }
        : null,
      certificate: summary.allCompleted
        ? {
            issuedTo: user.name,
            issuedEmail: user.email,
            issuedAt: summary.issuedAt ?? new Date(),
            program: 'Academic Guide Course & Certification'
          }
        : null
    };
  }
}
