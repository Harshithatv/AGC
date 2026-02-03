import { OrganizationType } from '@prisma/client';
export declare class CreatePurchaseDto {
    packageType: OrganizationType;
    organizationName: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    instituteName?: string;
    roleAtSchool?: string;
}
