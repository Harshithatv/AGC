import { Injectable } from '@nestjs/common';
import { ModuleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async getCompletionSummary(userId: string) {
    // Check if user already has a permanent certificate
    const certificate = await this.prisma.certificate.findUnique({
      where: { userId }
    });

    const [modules, progress] = await Promise.all([
      this.prisma.courseModule.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.moduleProgress.findMany({ where: { userId } })
    ]);

    const completedIds = new Set(
      progress.filter((item) => item.status === ModuleStatus.COMPLETED).map((item) => item.moduleId)
    );

    const completedCount = modules.filter((moduleItem) => completedIds.has(moduleItem.id)).length;

    // If user has a permanent certificate, they stay certified regardless of new modules
    // Show the counts from when they were certified so numbers look consistent
    if (certificate) {
      return {
        completedCount: certificate.totalModules,
        totalModules: certificate.totalModules,
        allCompleted: true,
        issuedAt: certificate.issuedAt
      };
    }

    // For users without a certificate, check dynamically
    const completedItems = progress
      .filter((item) => item.status === ModuleStatus.COMPLETED && item.completedAt)
      .sort((a, b) => (a.completedAt?.getTime() ?? 0) - (b.completedAt?.getTime() ?? 0));
    const issuedAt = completedItems.length ? completedItems[completedItems.length - 1].completedAt ?? null : null;

    const allCompleted = completedCount === modules.length && modules.length > 0;

    // Auto-issue permanent certificate if all modules are completed
    // This covers users who completed everything before the Certificate feature existed
    if (allCompleted && issuedAt) {
      try {
        await this.prisma.certificate.create({
          data: {
            userId,
            totalModules: modules.length,
            issuedAt
          }
        });

        // Fetch user details for the notification
        const certUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true, organizationId: true, organization: { select: { name: true } } }
        });

        if (certUser) {
          const orgName = certUser.organization?.name || 'Individual';

          // Notify system admin
          this.notificationsService.create({
            type: 'CERTIFICATION',
            title: 'Learner certified',
            message: `${certUser.name} (${orgName}) has completed all modules and earned certification.`,
            recipientRole: 'SYSTEM_ADMIN',
            link: `/dashboard/certified`,
          }).catch(() => {});

          // Notify the org admin of this user's organization
          if (certUser.organizationId) {
            this.notificationsService.create({
              type: 'CERTIFICATION',
              title: 'Learner certified',
              message: `${certUser.name} has completed all modules and earned certification.`,
              recipientRole: 'ORG_ADMIN',
              recipientOrgId: certUser.organizationId,
              link: `/dashboard/certified`,
            }).catch(() => {});
          }
        }
      } catch {
        // Certificate may already exist (race condition) — that's fine
      }
    }

    return {
      completedCount,
      totalModules: modules.length,
      allCompleted,
      issuedAt: allCompleted ? issuedAt : null
    };
  }
}
