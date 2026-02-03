import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private purchasesService;
    constructor(purchasesService: PurchasesService);
    pricing(): Promise<{
        id: string;
        packageType: import(".prisma/client").$Enums.OrganizationType;
        amount: number;
        currency: string;
        updatedAt: Date;
    }[]>;
    create(body: CreatePurchaseDto): Promise<{
        purchase: {
            id: string;
            packageType: import(".prisma/client").$Enums.OrganizationType;
            purchasedAt: Date;
            organizationId: string;
            purchasedById: string;
        };
        organization: {
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.OrganizationType;
            maxUsers: number;
            startDate: Date;
            createdAt: Date;
        };
        admin: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
}
