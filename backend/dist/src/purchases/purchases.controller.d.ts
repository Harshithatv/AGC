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
