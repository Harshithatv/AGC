import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { Role } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private progressService: ProgressService
  ) {}

  async getOrganizationWithStats(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        purchases: { orderBy: { purchasedAt: 'desc' }, take: 1 }
      }
    });

    if (!organization) {
      return null;
    }

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
      ...organization,
      userCount: users.length,
      certifiedCount
    };
  }

  async getCertifiedLearners(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId, role: Role.ORG_USER },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const certifiedUsers: Array<{
      id: string;
      name: string;
      email: string;
      certifiedAt: Date;
      completedModules: number;
      totalModules: number;
    }> = [];

    for (const user of users) {
      const summary = await this.progressService.getCompletionSummary(user.id);
      if (summary.allCompleted && summary.issuedAt) {
        certifiedUsers.push({
          id: user.id,
          name: user.name,
          email: user.email,
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
}
