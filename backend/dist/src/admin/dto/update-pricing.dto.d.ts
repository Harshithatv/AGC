import { OrganizationType } from '@prisma/client';
export declare class UpdatePricingDto {
    packageType: OrganizationType;
    amount: number;
    currency?: string;
}
