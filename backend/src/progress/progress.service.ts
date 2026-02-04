import { Injectable } from '@nestjs/common';
import { ModuleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getCompletionSummary(userId: string) {
    const [modules, progress] = await Promise.all([
      this.prisma.courseModule.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.moduleProgress.findMany({ where: { userId } })
    ]);

    const completedIds = new Set(
      progress.filter((item) => item.status === ModuleStatus.COMPLETED).map((item) => item.moduleId)
    );

    const completedItems = progress
      .filter((item) => item.status === ModuleStatus.COMPLETED && item.completedAt)
      .sort((a, b) => (a.completedAt?.getTime() ?? 0) - (b.completedAt?.getTime() ?? 0));
    const issuedAt = completedItems.length ? completedItems[completedItems.length - 1].completedAt ?? null : null;

    const completedCount = modules.filter((moduleItem) => completedIds.has(moduleItem.id)).length;
    const allCompleted = completedCount === modules.length && modules.length > 0;

    return {
      completedCount,
      totalModules: modules.length,
      allCompleted,
      issuedAt: allCompleted ? issuedAt : null
    };
  }
}
