"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModulesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ModulesService = class ModulesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async createModule(params) {
        return this.prisma.courseModule.create({ data: params });
    }
    async updateModule(id, updates) {
        return this.prisma.courseModule.update({ where: { id }, data: updates });
    }
    async deleteModule(id) {
        await this.prisma.moduleProgress.deleteMany({ where: { moduleId: id } });
        return this.prisma.courseModule.delete({ where: { id } });
    }
    async getModulesForUser(userId, organizationId) {
        const [modules, progress, organization] = await Promise.all([
            this.prisma.courseModule.findMany({ orderBy: { order: 'asc' } }),
            this.prisma.moduleProgress.findMany({ where: { userId } }),
            this.prisma.organization.findUnique({ where: { id: organizationId } })
        ]);
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const progressMap = new Map(progress.map((item) => [item.moduleId, item]));
        let unlocked = true;
        return modules.map((moduleItem) => {
            const itemProgress = progressMap.get(moduleItem.id);
            const status = itemProgress?.status ?? client_1.ModuleStatus.NOT_STARTED;
            const isActive = unlocked;
            if (status !== client_1.ModuleStatus.COMPLETED) {
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
    async startModule(userId, moduleId) {
        const moduleItem = await this.prisma.courseModule.findUnique({ where: { id: moduleId } });
        if (!moduleItem) {
            throw new common_1.NotFoundException('Module not found');
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
                status: client_1.ModuleStatus.IN_PROGRESS,
                startedAt: new Date()
            }
        });
    }
    async completeModule(userId, moduleId) {
        const moduleItem = await this.prisma.courseModule.findUnique({ where: { id: moduleId } });
        if (!moduleItem) {
            throw new common_1.NotFoundException('Module not found');
        }
        const modules = await this.prisma.courseModule.findMany({ orderBy: { order: 'asc' } });
        const currentIndex = modules.findIndex((m) => m.id === moduleId);
        if (currentIndex === -1) {
            throw new common_1.NotFoundException('Module not found');
        }
        if (currentIndex > 0) {
            const previousModule = modules[currentIndex - 1];
            const previousProgress = await this.prisma.moduleProgress.findUnique({
                where: { userId_moduleId: { userId, moduleId: previousModule.id } }
            });
            if (!previousProgress || previousProgress.status !== client_1.ModuleStatus.COMPLETED) {
                throw new common_1.BadRequestException('Complete previous module first');
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
                    status: client_1.ModuleStatus.COMPLETED,
                    startedAt: new Date(),
                    completedAt: new Date()
                }
            });
        }
        return this.prisma.moduleProgress.update({
            where: { id: existing.id },
            data: { status: client_1.ModuleStatus.COMPLETED, completedAt: new Date() }
        });
    }
};
exports.ModulesService = ModulesService;
exports.ModulesService = ModulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ModulesService);
//# sourceMappingURL=modules.service.js.map