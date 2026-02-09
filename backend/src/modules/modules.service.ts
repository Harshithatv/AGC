import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ModuleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ModulesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async listPublicModules() {
    return this.prisma.courseModule.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        order: true
      }
    });
  }

  async listAllModules() {
    return this.prisma.courseModule.findMany({
      orderBy: { order: 'asc' },
      include: { files: { orderBy: { order: 'asc' } } }
    });
  }

  async createModule(params: {
    title: string;
    description: string;
    order: number;
    deadlineDays: number;
    mediaType: 'VIDEO' | 'PRESENTATION' | 'PDF' | 'DOCUMENT';
    mediaUrl: string;
    createdById: string;
    files?: Array<{
      order: number;
      title?: string | null;
      mediaType: 'VIDEO' | 'PRESENTATION' | 'PDF' | 'DOCUMENT';
      mediaUrl: string;
    }>;
  }) {
    // Check for duplicate module order
    const existingWithOrder = await this.prisma.courseModule.findUnique({
      where: { order: params.order }
    });
    if (existingWithOrder) {
      throw new BadRequestException(`A module with order ${params.order} already exists`);
    }

    return this.prisma.courseModule.create({
      data: {
        title: params.title,
        description: params.description,
        order: params.order,
        deadlineDays: params.deadlineDays,
        mediaType: params.mediaType,
        mediaUrl: params.mediaUrl,
        createdById: params.createdById,
        files: params.files?.length
          ? {
              create: params.files.map((file) => ({
                order: file.order,
                title: file.title ?? null,
                mediaType: file.mediaType,
                mediaUrl: file.mediaUrl
              }))
            }
          : undefined
      }
    });
  }

  async updateModule(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      order: number;
      deadlineDays: number;
      mediaType: 'VIDEO' | 'PRESENTATION' | 'PDF' | 'DOCUMENT';
      mediaUrl: string;
    }>
  ) {
    // Check for duplicate module order (exclude current module)
    if (typeof updates.order === 'number') {
      const existingWithOrder = await this.prisma.courseModule.findFirst({
        where: { order: updates.order, id: { not: id } }
      });
      if (existingWithOrder) {
        throw new BadRequestException(`A module with order ${updates.order} already exists`);
      }
    }

    return this.prisma.courseModule.update({ where: { id }, data: updates });
  }

  async addModuleFiles(
    moduleId: string,
    files: Array<{
      title?: string;
      mediaType: 'VIDEO' | 'PRESENTATION' | 'PDF' | 'DOCUMENT';
      mediaUrl: string;
    }>
  ) {
    if (!files.length) return [];
    const existing = await this.prisma.moduleFile.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' }
    });
    const startOrder = (existing[existing.length - 1]?.order ?? 0) + 1;
    const toCreate = files.map((file, index) => ({
      moduleId,
      order: startOrder + index,
      title: file.title ?? null,
      mediaType: file.mediaType,
      mediaUrl: file.mediaUrl
    }));
    await this.prisma.moduleFile.createMany({ data: toCreate });
    return this.prisma.moduleFile.findMany({ where: { moduleId }, orderBy: { order: 'asc' } });
  }

  async deleteModuleFile(moduleId: string, fileId: string) {
    const file = await this.prisma.moduleFile.findUnique({ where: { id: fileId } });
    if (!file || file.moduleId !== moduleId) {
      throw new NotFoundException('Module file not found');
    }
    await this.prisma.moduleFileProgress.deleteMany({ where: { moduleFileId: fileId } });
    return this.prisma.moduleFile.delete({ where: { id: fileId } });
  }

  async deleteModule(id: string) {
    await this.prisma.moduleFileProgress.deleteMany({ where: { moduleFile: { moduleId: id } } });
    await this.prisma.moduleFile.deleteMany({ where: { moduleId: id } });
    await this.prisma.moduleProgress.deleteMany({ where: { moduleId: id } });
    return this.prisma.courseModule.delete({ where: { id } });
  }

  async addModuleFile(params: {
    moduleId: string;
    order?: number;
    title?: string;
    mediaType: 'VIDEO' | 'PRESENTATION' | 'PDF' | 'DOCUMENT';
    mediaUrl: string;
  }) {
    const moduleItem = await this.prisma.courseModule.findUnique({
      where: { id: params.moduleId },
      include: { files: { orderBy: { order: 'asc' } } }
    });
    if (!moduleItem) {
      throw new NotFoundException('Module not found');
    }

    const existingOrders = new Set((moduleItem.files ?? []).map((file) => file.order));
    const maxOrder = moduleItem.files?.[moduleItem.files.length - 1]?.order ?? 0;
    const requestedOrder = typeof params.order === 'number' && params.order > 0 ? params.order : null;
    const nextOrder =
      requestedOrder && !existingOrders.has(requestedOrder) ? requestedOrder : maxOrder + 1;

    const file = await this.prisma.moduleFile.create({
      data: {
        moduleId: params.moduleId,
        order: nextOrder,
        title: params.title ?? null,
        mediaType: params.mediaType,
        mediaUrl: params.mediaUrl
      }
    });

    return file;
  }

  async getModulesForUser(userId: string, organizationId: string) {
    // Check if user has a permanent certificate — if so, only show modules from certification time
    const certificate = await this.prisma.certificate.findUnique({ where: { userId } });

    const [allModules, progress, progressFiles, organization] = await Promise.all([
      this.prisma.courseModule.findMany({
        orderBy: { order: 'asc' },
        include: { files: { orderBy: { order: 'asc' } } }
      }),
      this.prisma.moduleProgress.findMany({ where: { userId } }),
      this.prisma.moduleFileProgress.findMany({ where: { userId } }),
      this.prisma.organization.findUnique({ where: { id: organizationId } })
    ]);

    // For certified users, filter out modules AND files added after their certification
    const modules = certificate
      ? allModules.filter((m) => m.createdAt <= certificate.issuedAt)
      : allModules;

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const moduleProgressMap = new Map(progress.map((item) => [item.moduleId, item]));
    const fileProgressMap = new Map(progressFiles.map((item) => [item.moduleFileId, item]));

    let unlocked = true;
    return modules.map((moduleItem) => {
      // For certified users, also filter out files added after certification
      const moduleFiles = certificate
        ? (moduleItem.files ?? []).filter((f) => f.createdAt <= certificate.issuedAt)
        : (moduleItem.files ?? []);
      const moduleProgress = moduleProgressMap.get(moduleItem.id);
      const hasFiles = moduleFiles.length > 0;
      let fileUnlocked = unlocked;
      const files = moduleFiles.map((file) => {
        const fileProgress = fileProgressMap.get(file.id);
        const status = fileProgress?.status ?? ModuleStatus.NOT_STARTED;
        const isActive = fileUnlocked;
        if (status !== ModuleStatus.COMPLETED) {
          fileUnlocked = false;
        }
        return {
          ...file,
          status,
          isActive,
          startedAt: fileProgress?.startedAt ?? null,
          completedAt: fileProgress?.completedAt ?? null
        };
      });

      const completedFileCount = files.filter((file) => file.status === ModuleStatus.COMPLETED).length;
      const moduleCompleted = hasFiles ? completedFileCount === files.length : moduleProgress?.status === ModuleStatus.COMPLETED;
      const moduleStarted = hasFiles
        ? files.some((file) => file.status !== ModuleStatus.NOT_STARTED)
        : moduleProgress?.status === ModuleStatus.IN_PROGRESS;
      const status = moduleCompleted
        ? ModuleStatus.COMPLETED
        : moduleStarted
          ? ModuleStatus.IN_PROGRESS
          : ModuleStatus.NOT_STARTED;
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
        startedAt: moduleProgress?.startedAt ?? null,
        completedAt: moduleProgress?.completedAt ?? null,
        files
      };
    });
  }

  async startModule(userId: string, moduleId: string) {
    const moduleItem = await this.prisma.courseModule.findUnique({ where: { id: moduleId } });
    if (!moduleItem) {
      throw new NotFoundException('Module not found');
    }

    const files = await this.prisma.moduleFile.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' }
    });

    const existing = await this.prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } }
    });

    if (!existing) {
      await this.prisma.moduleProgress.create({
        data: {
          userId,
          moduleId,
          status: ModuleStatus.IN_PROGRESS,
          startedAt: new Date()
        }
      });
    }

    if (files.length > 0) {
      const firstFile = files[0];
      const existingFile = await this.prisma.moduleFileProgress.findUnique({
        where: { userId_moduleFileId: { userId, moduleFileId: firstFile.id } }
      });
      if (!existingFile) {
        await this.prisma.moduleFileProgress.create({
          data: {
            userId,
            moduleFileId: firstFile.id,
            status: ModuleStatus.IN_PROGRESS,
            startedAt: new Date()
          }
        });
      }
    }

    return this.prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } }
    });
  }

  async completeModule(userId: string, moduleId: string) {
    const moduleItem = await this.prisma.courseModule.findUnique({ where: { id: moduleId } });
    if (!moduleItem) {
      throw new NotFoundException('Module not found');
    }

    const files = await this.prisma.moduleFile.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' }
    });

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

    if (files.length > 0) {
      const completedCount = await this.prisma.moduleFileProgress.count({
        where: { userId, moduleFile: { moduleId }, status: ModuleStatus.COMPLETED }
      });
      if (completedCount !== files.length) {
        throw new BadRequestException('Complete all files in this module first');
      }
    }

    const existing = await this.prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } }
    });

    let result;
    if (!existing) {
      result = await this.prisma.moduleProgress.create({
        data: {
          userId,
          moduleId,
          status: ModuleStatus.COMPLETED,
          startedAt: new Date(),
          completedAt: new Date()
        }
      });
    } else {
      result = await this.prisma.moduleProgress.update({
        where: { id: existing.id },
        data: { status: ModuleStatus.COMPLETED, completedAt: new Date() }
      });
    }

    // Check if ALL modules are now completed → issue permanent certificate
    await this.issueCertificateIfComplete(userId, modules.length);

    return result;
  }

  async startModuleFile(userId: string, moduleId: string, fileId: string) {
    const file = await this.prisma.moduleFile.findUnique({ where: { id: fileId } });
    if (!file || file.moduleId !== moduleId) {
      throw new NotFoundException('Module file not found');
    }

    const files = await this.prisma.moduleFile.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' }
    });
    const index = files.findIndex((item) => item.id === fileId);
    if (index === -1) {
      throw new NotFoundException('Module file not found');
    }

    if (index > 0) {
      const prevFile = files[index - 1];
      const prevProgress = await this.prisma.moduleFileProgress.findUnique({
        where: { userId_moduleFileId: { userId, moduleFileId: prevFile.id } }
      });
      if (!prevProgress || prevProgress.status !== ModuleStatus.COMPLETED) {
        throw new BadRequestException('Complete previous file first');
      }
    }

    const moduleProgress = await this.prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } }
    });
    if (!moduleProgress) {
      await this.prisma.moduleProgress.create({
        data: { userId, moduleId, status: ModuleStatus.IN_PROGRESS, startedAt: new Date() }
      });
    }

    const existing = await this.prisma.moduleFileProgress.findUnique({
      where: { userId_moduleFileId: { userId, moduleFileId: fileId } }
    });
    if (existing) {
      return existing;
    }

    return this.prisma.moduleFileProgress.create({
      data: {
        userId,
        moduleFileId: fileId,
        status: ModuleStatus.IN_PROGRESS,
        startedAt: new Date()
      }
    });
  }

  async completeModuleFile(userId: string, moduleId: string, fileId: string) {
    const file = await this.prisma.moduleFile.findUnique({ where: { id: fileId } });
    if (!file || file.moduleId !== moduleId) {
      throw new NotFoundException('Module file not found');
    }

    const files = await this.prisma.moduleFile.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' }
    });
    const index = files.findIndex((item) => item.id === fileId);
    if (index === -1) {
      throw new NotFoundException('Module file not found');
    }

    if (index > 0) {
      const prevFile = files[index - 1];
      const prevProgress = await this.prisma.moduleFileProgress.findUnique({
        where: { userId_moduleFileId: { userId, moduleFileId: prevFile.id } }
      });
      if (!prevProgress || prevProgress.status !== ModuleStatus.COMPLETED) {
        throw new BadRequestException('Complete previous file first');
      }
    }

    const existing = await this.prisma.moduleFileProgress.findUnique({
      where: { userId_moduleFileId: { userId, moduleFileId: fileId } }
    });
    if (!existing) {
      await this.prisma.moduleFileProgress.create({
        data: {
          userId,
          moduleFileId: fileId,
          status: ModuleStatus.COMPLETED,
          startedAt: new Date(),
          completedAt: new Date()
        }
      });
    } else {
      await this.prisma.moduleFileProgress.update({
        where: { id: existing.id },
        data: { status: ModuleStatus.COMPLETED, completedAt: new Date() }
      });
    }

    const completedCount = await this.prisma.moduleFileProgress.count({
      where: { userId, moduleFile: { moduleId }, status: ModuleStatus.COMPLETED }
    });
    if (completedCount === files.length) {
      const moduleProgress = await this.prisma.moduleProgress.findUnique({
        where: { userId_moduleId: { userId, moduleId } }
      });
      if (!moduleProgress) {
        await this.prisma.moduleProgress.create({
          data: { userId, moduleId, status: ModuleStatus.COMPLETED, startedAt: new Date(), completedAt: new Date() }
        });
      } else {
        await this.prisma.moduleProgress.update({
          where: { id: moduleProgress.id },
          data: { status: ModuleStatus.COMPLETED, completedAt: new Date() }
        });
      }

      // Check if ALL modules are now completed → issue permanent certificate
      const totalModules = await this.prisma.courseModule.count();
      await this.issueCertificateIfComplete(userId, totalModules);
    }

    return { success: true };
  }

  /**
   * Issues a permanent certificate if the user has completed all current modules.
   * Once issued, the certificate persists even if new modules are added later.
   */
  private async issueCertificateIfComplete(userId: string, totalModules: number) {
    // Don't issue if no modules exist
    if (totalModules === 0) return;

    // Check if certificate already exists
    const existingCert = await this.prisma.certificate.findUnique({
      where: { userId }
    });
    if (existingCert) return;

    // Count how many modules the user has completed
    const completedModuleCount = await this.prisma.moduleProgress.count({
      where: { userId, status: ModuleStatus.COMPLETED }
    });

    // Issue certificate only if ALL modules are completed
    if (completedModuleCount >= totalModules) {
      await this.prisma.certificate.create({
        data: {
          userId,
          totalModules,
          issuedAt: new Date()
        }
      });

      // Send certification notifications
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

        // Notify org admin of the user's organization
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
    }
  }
}
