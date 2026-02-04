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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../prisma/prisma.service");
const modules_service_1 = require("../modules/modules.service");
const progress_service_1 = require("../progress/progress.service");
let AdminService = class AdminService {
    constructor(prisma, modulesService, progressService) {
        this.prisma = prisma;
        this.modulesService = modulesService;
        this.progressService = progressService;
    }
    async bootstrapSystemAdmin(params) {
        const existing = await this.prisma.user.findUnique({ where: { email: params.email } });
        if (existing) {
            throw new common_1.BadRequestException('Admin already exists');
        }
        const passwordHash = await bcrypt.hash(params.password, 10);
        return this.prisma.user.create({
            data: {
                name: params.name,
                email: params.email,
                passwordHash,
                role: client_1.Role.SYSTEM_ADMIN
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
        const results = await Promise.all(organizations.map(async (organization) => {
            const userCount = await this.prisma.user.count({
                where: { organizationId: organization.id, role: client_1.Role.ORG_USER }
            });
            return {
                ...organization,
                userCount
            };
        }));
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
    async updatePricing(params) {
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
    async getOrganization(id) {
        return this.prisma.organization.findUnique({
            where: { id },
            include: {
                purchases: { orderBy: { purchasedAt: 'desc' }, take: 1 }
            }
        });
    }
    async listOrganizationUsersWithProgress(organizationId) {
        const users = await this.prisma.user.findMany({
            where: { organizationId, role: client_1.Role.ORG_USER },
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
        const usersWithProgress = await Promise.all(users.map(async (user) => {
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
        }));
        return usersWithProgress;
    }
    async getUserProgressDetails(userId) {
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        modules_service_1.ModulesService,
        progress_service_1.ProgressService])
], AdminService);
//# sourceMappingURL=admin.service.js.map