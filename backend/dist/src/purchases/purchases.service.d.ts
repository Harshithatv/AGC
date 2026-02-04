import { OrganizationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class PurchasesService {
    private prisma;
    constructor(prisma: PrismaService);
    getPricing(): Promise<{
        id: string;
        packageType: import(".prisma/client").$Enums.OrganizationType;
        amount: number;
        currency: string;
        updatedAt: Date;
    }[]>;
    createPurchase(params: {
        packageType: OrganizationType;
        organizationName: string;
        adminName: string;
        adminEmail: string;
        adminPassword: string;
        instituteName?: string;
        roleAtSchool?: string;
    }): Promise<{
        purchase: {
            id: string;
            organizationId: string;
            purchasedAt: Date;
            packageType: import(".prisma/client").$Enums.OrganizationType;
            purchasedById: string;
        };
        organization: {
            id: string;
            name: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.OrganizationType;
            maxUsers: number;
            startDate: Date;
        };
        admin: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
}
