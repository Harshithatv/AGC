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
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../prisma/prisma.service");
const MAX_USERS_BY_TYPE = {
    [client_1.OrganizationType.SINGLE]: 1,
    [client_1.OrganizationType.GROUP]: 5,
    [client_1.OrganizationType.INSTITUTION]: 10
};
let PurchasesService = class PurchasesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPricing() {
        return this.prisma.packagePrice.findMany({ orderBy: { packageType: 'asc' } });
    }
    async createPurchase(params) {
        const existing = await this.prisma.user.findUnique({
            where: { email: params.adminEmail }
        });
        if (existing) {
            throw new common_1.BadRequestException('Admin email already in use');
        }
        let organizationName = params.organizationName;
        let adminName = params.adminName;
        if (params.packageType === client_1.OrganizationType.INSTITUTION) {
            if (!params.instituteName) {
                throw new common_1.BadRequestException('Institute name is required for institution packages');
            }
            organizationName = params.instituteName;
            if (params.roleAtSchool && !adminName.includes(params.roleAtSchool)) {
                adminName = `${adminName} (${params.roleAtSchool})`;
            }
        }
        const passwordHash = await bcrypt.hash(params.adminPassword, 10);
        return this.prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: {
                    name: organizationName,
                    type: params.packageType,
                    maxUsers: MAX_USERS_BY_TYPE[params.packageType],
                    startDate: new Date()
                }
            });
            const assignedRole = params.packageType === client_1.OrganizationType.SINGLE ? client_1.Role.ORG_USER : client_1.Role.ORG_ADMIN;
            const admin = await tx.user.create({
                data: {
                    name: adminName,
                    email: params.adminEmail,
                    passwordHash,
                    role: assignedRole,
                    organizationId: organization.id
                }
            });
            const purchase = await tx.packagePurchase.create({
                data: {
                    packageType: params.packageType,
                    organizationId: organization.id,
                    purchasedById: admin.id
                }
            });
            return {
                purchase,
                organization,
                admin: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role
                }
            };
        });
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map