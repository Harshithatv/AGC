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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../prisma/prisma.service");
const modules_service_1 = require("../modules/modules.service");
const progress_service_1 = require("../progress/progress.service");
let UsersService = class UsersService {
    constructor(prisma, modulesService, progressService) {
        this.prisma = prisma;
        this.modulesService = modulesService;
        this.progressService = progressService;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async findById(id) {
        return this.prisma.user.findUnique({ where: { id } });
    }
    async listByOrganization(organizationId) {
        return this.prisma.user.findMany({
            where: { organizationId, role: client_1.Role.ORG_USER },
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
    }
    async createUser(params) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: params.organizationId }
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const currentCount = await this.prisma.user.count({
            where: { organizationId: params.organizationId, role: client_1.Role.ORG_USER }
        });
        if (currentCount >= organization.maxUsers) {
            throw new common_1.BadRequestException('User limit reached for this package');
        }
        if (organization.type === client_1.OrganizationType.SINGLE && currentCount >= 1) {
            throw new common_1.BadRequestException('Single user package supports only one user');
        }
        const passwordHash = await bcrypt.hash(params.password, 10);
        return this.prisma.user.create({
            data: {
                name: params.name,
                email: params.email,
                passwordHash,
                role: params.role ?? client_1.Role.ORG_USER,
                organizationId: params.organizationId
            },
            select: { id: true, name: true, email: true, role: true, organizationId: true }
        });
    }
    async bulkCreateUsers(params) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: params.organizationId }
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const currentCount = await this.prisma.user.count({
            where: { organizationId: params.organizationId, role: client_1.Role.ORG_USER }
        });
        if (currentCount + params.users.length > organization.maxUsers) {
            throw new common_1.BadRequestException('User limit exceeded for this package');
        }
        const data = await Promise.all(params.users.map(async (user) => ({
            name: user.name,
            email: user.email,
            passwordHash: await bcrypt.hash(user.password, 10),
            role: client_1.Role.ORG_USER,
            organizationId: params.organizationId
        })));
        await this.prisma.user.createMany({ data });
        return this.listByOrganization(params.organizationId);
    }
    async getOrgUserProgressDetails(organizationId, userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, organizationId, role: client_1.Role.ORG_USER },
            select: { id: true, name: true, email: true, role: true, organizationId: true }
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const [organization, modules, summary] = await Promise.all([
            this.prisma.organization.findUnique({ where: { id: organizationId } }),
            this.modulesService.getModulesForUser(user.id, organizationId),
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
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        modules_service_1.ModulesService,
        progress_service_1.ProgressService])
], UsersService);
//# sourceMappingURL=users.service.js.map