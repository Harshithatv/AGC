import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
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
        purchases: { orderBy: { purchasedAt: 'desc' }, take: 1 },
        users: {
          where: { role: Role.ORG_ADMIN },
          select: { name: true },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const results = await Promise.all(
      organizations.map(async (organization) => {
        const userCount = await this.prisma.user.count({
          where: { organizationId: organization.id, role: Role.ORG_USER }
        });

        const adminName = organization.users?.[0]?.name || '';

        return {
          ...organization,
          userCount,
          adminName
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

  async updatePricing(params: {
    packageType: string;
    amount: number;
    currency?: string;
    maxUsers?: number;
    label?: string;
    summary?: string;
    features?: string[];
    highlight?: boolean;
  }) {
    const price = await this.prisma.packagePrice.upsert({
      where: { packageType: params.packageType },
      create: {
        packageType: params.packageType,
        amount: params.amount,
        currency: params.currency ?? 'INR',
        maxUsers: params.maxUsers ?? 1,
        label: params.label ?? '',
        summary: params.summary ?? '',
        features: params.features ?? [],
        highlight: params.highlight ?? false
      },
      update: {
        amount: params.amount,
        currency: params.currency ?? 'INR',
        ...(typeof params.maxUsers === 'number' ? { maxUsers: params.maxUsers } : {}),
        ...(typeof params.label === 'string' ? { label: params.label } : {}),
        ...(typeof params.summary === 'string' ? { summary: params.summary } : {}),
        ...(Array.isArray(params.features) ? { features: params.features } : {}),
        ...(typeof params.highlight === 'boolean' ? { highlight: params.highlight } : {})
      }
    });

    if (typeof params.maxUsers === 'number') {
      await this.prisma.organization.updateMany({
        where: { type: params.packageType },
        data: { maxUsers: params.maxUsers }
      });
    }

    return price;
  }

  async deletePricing(packageType: string) {
    const usageCount = await this.prisma.packagePurchase.count({
      where: { packageType }
    });

    const orgCount = await this.prisma.organization.count({
      where: { type: packageType }
    });

    if (usageCount > 0 || orgCount > 0) {
      throw new BadRequestException('Package cannot be deleted because it is in use.');
    }

    return this.prisma.packagePrice.delete({
      where: { packageType }
    });
  }

  async getOrganization(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        purchases: { orderBy: { purchasedAt: 'desc' }, take: 1 },
        users: {
          where: { role: Role.ORG_ADMIN },
          select: { name: true },
          take: 1
        }
      }
    });

    if (!organization) return null;

    const adminName = organization.users?.[0]?.name || '';
    return { ...organization, adminName };
  }

  async listOrganizationUsersWithProgress(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId, role: Role.ORG_USER },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, createdAt: true }
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

  async getCertificationStats() {
    // Get all ORG_USER users with their progress
    const users = await this.prisma.user.findMany({
      where: { role: Role.ORG_USER },
      select: { id: true, name: true }
    });

    let certifiedCount = 0;
    for (const user of users) {
      const summary = await this.progressService.getCompletionSummary(user.id);
      if (summary.allCompleted) {
        certifiedCount++;
      }
    }

    return {
      totalLearners: users.length,
      certifiedCount
    };
  }

  async getCertifiedLearners() {
    const users = await this.prisma.user.findMany({
      where: { role: Role.ORG_USER },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        organization: { 
          select: { 
            id: true, 
            name: true, 
            type: true,
            users: {
              where: { role: Role.ORG_ADMIN },
              select: { name: true },
              take: 1
            }
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const certifiedUsers: Array<{
      id: string;
      name: string;
      email: string;
      organization: string;
      certifiedAt: Date;
      completedModules: number;
      totalModules: number;
    }> = [];

    for (const user of users) {
      const summary = await this.progressService.getCompletionSummary(user.id);
      if (summary.allCompleted && summary.issuedAt) {
        // Clean organization name (remove "Group" suffix if present)
        const orgDisplay = user.organization?.name?.replace(/\s+Group$/i, '').trim() || 'Individual';

        certifiedUsers.push({
          id: user.id,
          name: user.name,
          email: user.email,
          organization: orgDisplay,
          certifiedAt: summary.issuedAt,
          completedModules: summary.completedCount,
          totalModules: summary.totalModules
        });
      }
    }

    // Sort by certification date (most recent first)
    certifiedUsers.sort((a, b) => new Date(b.certifiedAt).getTime() - new Date(a.certifiedAt).getTime());

    return certifiedUsers;
  }

  async getOrganizationCertificationStats(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId, role: Role.ORG_USER },
      select: { id: true }
    });

    let certifiedCount = 0;
    for (const user of users) {
      const summary = await this.progressService.getCompletionSummary(user.id);
      if (summary.allCompleted) {
        certifiedCount++;
      }
    }

    return {
      totalLearners: users.length,
      certifiedCount
    };
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
