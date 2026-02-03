import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ModuleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  async listPublicModules() {
    return this.prisma.courseModule.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        durationMinutes: true
      }
    });
  }

  async listAllModules() {
    return this.prisma.courseModule.findMany({
      orderBy: { order: 'asc' }
    });
  }

  async createModule(params: {
    title: string;
    description: string;
    order: number;
    durationMinutes: number;
    deadlineDays: number;
    mediaType: 'VIDEO' | 'PRESENTATION';
    mediaUrl: string;
    createdById: string;
  }) {
    return this.prisma.courseModule.create({ data: params });
  }

  async updateModule(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      order: number;
      durationMinutes: number;
      deadlineDays: number;
      mediaType: 'VIDEO' | 'PRESENTATION';
      mediaUrl: string;
    }>
  ) {
    return this.prisma.courseModule.update({ where: { id }, data: updates });
  }

  async deleteModule(id: string) {
    await this.prisma.moduleProgress.deleteMany({ where: { moduleId: id } });
    return this.prisma.courseModule.delete({ where: { id } });
  }

  async getModulesForUser(userId: string, organizationId: string) {
    const [modules, progress, organization] = await Promise.all([
      this.prisma.courseModule.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.moduleProgress.findMany({ where: { userId } }),
      this.prisma.organization.findUnique({ where: { id: organizationId } })
    ]);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const progressMap = new Map(progress.map((item) => [item.moduleId, item]));

    let unlocked = true;
    return modules.map((moduleItem) => {
      const itemProgress = progressMap.get(moduleItem.id);
      const status = itemProgress?.status ?? ModuleStatus.NOT_STARTED;
      const isActive = unlocked;

      if (status !== ModuleStatus.COMPLETED) {
        unlocked = false;
      }

      const deadline = new Date(organization.startDate);
      deadline.setDate(deadline.getDate() + moduleItem.deadlineDays * moduleItem.order);

      return {
        ...moduleItem,
        status,
        isActive,
        deadline,
        startedAt: itemProgress?.startedAt ?? null,
        completedAt: itemProgress?.completedAt ?? null
      };
    });
  }

  async startModule(userId: string, moduleId: string) {
    const moduleItem = await this.prisma.courseModule.findUnique({ where: { id: moduleId } });
    if (!moduleItem) {
      throw new NotFoundException('Module not found');
    }

    const existing = await this.prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } }
    });

    if (existing) {
      return existing;
    }

    return this.prisma.moduleProgress.create({
      data: {
        userId,
        moduleId,
        status: ModuleStatus.IN_PROGRESS,
        startedAt: new Date()
      }
    });
  }

  async completeModule(userId: string, moduleId: string) {
    const moduleItem = await this.prisma.courseModule.findUnique({ where: { id: moduleId } });
    if (!moduleItem) {
      throw new NotFoundException('Module not found');
    }

    const modules = await this.prisma.courseModule.findMany({ orderBy: { order: 'asc' } });
    const currentIndex = modules.findIndex((m) => m.id === moduleId);
    if (currentIndex === -1) {
      throw new NotFoundException('Module not found');
    }

    if (currentIndex > 0) {
      const previousModule = modules[currentIndex - 1];
      const previousProgress = await this.prisma.moduleProgress.findUnique({
        where: { userId_moduleId: { userId, moduleId: previousModule.id } }
      });

      if (!previousProgress || previousProgress.status !== ModuleStatus.COMPLETED) {
        throw new BadRequestException('Complete previous module first');
      }
    }

    const existing = await this.prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } }
    });

    if (!existing) {
      return this.prisma.moduleProgress.create({
        data: {
          userId,
          moduleId,
          status: ModuleStatus.COMPLETED,
          startedAt: new Date(),
          completedAt: new Date()
        }
      });
    }

    return this.prisma.moduleProgress.update({
      where: { id: existing.id },
      data: { status: ModuleStatus.COMPLETED, completedAt: new Date() }
    });
  }
}
