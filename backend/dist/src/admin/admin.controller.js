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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/jwt-auth.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const admin_service_1 = require("./admin.service");
const bootstrap_admin_dto_1 = require("./dto/bootstrap-admin.dto");
const update_pricing_dto_1 = require("./dto/update-pricing.dto");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async bootstrap(key, body) {
        const expected = process.env.BOOTSTRAP_KEY || 'bootstrap-me';
        if (key !== expected) {
            return { message: 'Invalid bootstrap key' };
        }
        return this.adminService.bootstrapSystemAdmin({
            name: body.name,
            email: body.email,
            password: body.password
        });
    }
    async listOrganizations() {
        return this.adminService.listOrganizations();
    }
    async listPurchases() {
        return this.adminService.listPurchases();
    }
    async listPricing() {
        return this.adminService.getPricing();
    }
    async updatePricing(body) {
        return this.adminService.updatePricing({
            packageType: body.packageType,
            amount: body.amount,
            currency: body.currency
        });
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('bootstrap'),
    __param(0, (0, common_1.Headers)('x-bootstrap-key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, bootstrap_admin_dto_1.BootstrapAdminDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "bootstrap", null);
__decorate([
    (0, common_1.Get)('organizations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.SYSTEM_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listOrganizations", null);
__decorate([
    (0, common_1.Get)('purchases'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.SYSTEM_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listPurchases", null);
__decorate([
    (0, common_1.Get)('pricing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.SYSTEM_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listPricing", null);
__decorate([
    (0, common_1.Put)('pricing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.SYSTEM_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_pricing_dto_1.UpdatePricingDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePricing", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map