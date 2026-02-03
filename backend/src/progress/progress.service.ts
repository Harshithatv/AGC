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

    const completedCount = modules.filter((moduleItem) => completedIds.has(moduleItem.id)).length;
    const allCompleted = completedCount === modules.length && modules.length > 0;

    return {
      completedCount,
      totalModules: modules.length,
      allCompleted
    };
  }
}
