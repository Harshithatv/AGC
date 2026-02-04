import { PrismaService } from '../prisma/prisma.service';
export declare class OrganizationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getOrganizationWithStats(organizationId: string): Promise<{
        userCount: number;
        purchases: {
            id: string;
            purchasedAt: Date;
            organizationId: string;
            packageType: import(".prisma/client").$Enums.OrganizationType;
            purchasedById: string;
        }[];
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.OrganizationType;
        maxUsers: number;
        startDate: Date;
        createdAt: Date;
    } | null>;
}
