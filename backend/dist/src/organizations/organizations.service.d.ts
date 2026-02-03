import { PrismaService } from '../prisma/prisma.service';
export declare class OrganizationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getOrganizationWithStats(organizationId: string): Promise<{
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
    } | null>;
}
