import { OrganizationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    bootstrapSystemAdmin(params: {
        name: string;
        email: string;
        password: string;
    }): Promise<any>;
    listOrganizations(): Promise<any[]>;
    listPurchases(): Promise<any>;
    getPricing(): Promise<any>;
    updatePricing(params: {
        packageType: OrganizationType;
        amount: number;
        currency?: string;
    }): Promise<any>;
}
