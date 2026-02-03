import { AdminService } from './admin.service';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    bootstrap(key: string, body: BootstrapAdminDto): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
    } | {
        message: string;
    }>;
    listOrganizations(): Promise<{
        userCount: number;
        moduleDeadlines: {
            id: string;
            title: string;
            order: number;
            deadline: Date;
        }[];
        purchases: {
            id: string;
            organizationId: string;
            purchasedAt: Date;
            packageType: import(".prisma/client").$Enums.OrganizationType;
            purchasedById: string;
        }[];
        id: string;
        name: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.OrganizationType;
        maxUsers: number;
        startDate: Date;
    }[]>;
    listPurchases(): Promise<({
        organization: {
            id: string;
            name: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.OrganizationType;
            maxUsers: number;
            startDate: Date;
        };
        purchasedBy: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        organizationId: string;
        purchasedAt: Date;
        packageType: import(".prisma/client").$Enums.OrganizationType;
        purchasedById: string;
    })[]>;
    listPricing(): Promise<{
        id: string;
        packageType: import(".prisma/client").$Enums.OrganizationType;
        amount: number;
        currency: string;
        updatedAt: Date;
    }[]>;
    updatePricing(body: UpdatePricingDto): Promise<{
        id: string;
        packageType: import(".prisma/client").$Enums.OrganizationType;
        amount: number;
        currency: string;
        updatedAt: Date;
    }>;
}
