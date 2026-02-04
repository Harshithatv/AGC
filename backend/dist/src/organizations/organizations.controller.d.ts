import { OrganizationsService } from './organizations.service';
export declare class OrganizationsController {
    private organizationsService;
    constructor(organizationsService: OrganizationsService);
    getMyOrganization(user: {
        organizationId?: string;
    }): Promise<{
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
