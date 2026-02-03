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
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
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
        const modules = await this.prisma.courseModule.findMany({
            orderBy: { order: 'asc' }
        });
        const organizations = await this.prisma.organization.findMany({
            include: {
                purchases: { orderBy: { purchasedAt: 'desc' }, take: 1 }
            },
            orderBy: { createdAt: 'desc' }
        });
        const results = await Promise.all(organizations.map(async (organization) => {
            const userCount = await this.prisma.user.count({
                where: { organizationId: organization.id }
            });
            const moduleDeadlines = modules.map((moduleItem) => {
                const deadline = new Date(organization.startDate);
                deadline.setDate(deadline.getDate() + moduleItem.deadlineDays * moduleItem.order);
                return {
                    id: moduleItem.id,
                    title: moduleItem.title,
                    order: moduleItem.order,
                    deadline
                };
            });
            return {
                ...organization,
                userCount,
                moduleDeadlines
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
            update: { amount: params.amount, currency: params.currency ?? 'INR' },
            create: { packageType: params.packageType, amount: params.amount, currency: params.currency ?? 'INR' }
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map