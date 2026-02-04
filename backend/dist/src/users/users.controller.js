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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/jwt-auth.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const current_user_decorator_1 = require("../common/current-user.decorator");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const bulk_users_dto_1 = require("./dto/bulk-users.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async listUsers(user) {
        return this.usersService.listByOrganization(user.organizationId);
    }
    async createUser(user, body) {
        console.warn('CreateUser payload types', {
            nameType: typeof body?.name,
            emailType: typeof body?.email,
            passwordType: typeof body?.password,
            nameLength: body?.name?.length ?? null,
            emailLength: body?.email?.length ?? null,
            passwordLength: body?.password?.length ?? null
        });
        return this.usersService.createUser({
            organizationId: user.organizationId,
            name: body.name,
            email: body.email,
            password: body.password
        });
    }
    async bulkCreate(user, body) {
        console.warn('BulkCreate payload summary', {
            total: body?.users?.length ?? 0,
            first: body?.users?.[0]
                ? {
                    nameType: typeof body.users[0].name,
                    emailType: typeof body.users[0].email,
                    passwordType: typeof body.users[0].password,
                    nameLength: body.users[0].name?.length ?? null,
                    emailLength: body.users[0].email?.length ?? null,
                    passwordLength: body.users[0].password?.length ?? null
                }
                : null
        });
        return this.usersService.bulkCreateUsers({
            organizationId: user.organizationId,
            users: body.users
        });
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, roles_decorator_1.Roles)(client_1.Role.ORG_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, bulk_users_dto_1.BulkUsersDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "bulkCreate", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map