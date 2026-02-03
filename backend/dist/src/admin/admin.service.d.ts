import { OrganizationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    bootstrapSystemAdmin(params: {
        name: string;
        email: string;
        password: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
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
    getPricing(): Promise<{
        id: string;
        packageType: import(".prisma/client").$Enums.OrganizationType;
        amount: number;
        currency: string;
        updatedAt: Date;
    }[]>;
    updatePricing(params: {
        packageType: OrganizationType;
        amount: number;
        currency?: string;
    }): Promise<{
        id: string;
        packageType: import(".prisma/client").$Enums.OrganizationType;
        amount: number;
        currency: string;
        updatedAt: Date;
    }>;
}
