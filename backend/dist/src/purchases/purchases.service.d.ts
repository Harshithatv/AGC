import { OrganizationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class PurchasesService {
    private prisma;
    constructor(prisma: PrismaService);
    getPricing(): Promise<any>;
    createPurchase(params: {
        packageType: OrganizationType;
        organizationName: string;
        adminName: string;
        adminEmail: string;
        adminPassword: string;
        instituteName?: string;
        roleAtSchool?: string;
    }): Promise<any>;
}
