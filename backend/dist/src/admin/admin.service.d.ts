import { OrganizationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ModulesService } from '../modules/modules.service';
import { ProgressService } from '../progress/progress.service';
export declare class AdminService {
    private prisma;
    private modulesService;
    private progressService;
    constructor(prisma: PrismaService, modulesService: ModulesService, progressService: ProgressService);
    bootstrapSystemAdmin(params: {
        name: string;
        email: string;
        password: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    listOrganizations(): Promise<{
        userCount: number;
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
    }[]>;
    listPurchases(): Promise<({
        organization: {
            id: string;
            name: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.OrganizationType;
            maxUsers: number;
            startDate: Date;
        };
        purchasedBy: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        organizationId: string;
        purchasedAt: Date;
        packageType: import(".prisma/client").$Enums.OrganizationType;
        purchasedById: string;
    })[]>;
    getPricing(): Promise<{
        id: string;
        packageType: import(".prisma/client").$Enums.OrganizationType;
        amount: number;
        currency: string;
        updatedAt: Date;
    }[]>;
    updatePricing(params: {
        packageType: OrganizationType;
        amount: number;
        currency?: string;
    }): Promise<{
        id: string;
        packageType: import(".prisma/client").$Enums.OrganizationType;
        amount: number;
        currency: string;
        updatedAt: Date;
    }>;
    getOrganization(id: string): Promise<({
        purchases: {
            id: string;
            organizationId: string;
            purchasedAt: Date;
            packageType: import(".prisma/client").$Enums.OrganizationType;
            purchasedById: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.OrganizationType;
        maxUsers: number;
        startDate: Date;
    }) | null>;
    listOrganizationUsersWithProgress(organizationId: string): Promise<{
        progress: {
            completedCount: number;
            totalModules: number;
            allCompleted: boolean;
            issuedAt: Date | null;
        };
        certificate: {
            issuedTo: string;
            issuedEmail: string;
            issuedAt: Date;
            program: string;
        } | null;
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
    getUserProgressDetails(userId: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            organizationId: string | null;
        };
        organization: {
            id: string;
            name: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.OrganizationType;
            maxUsers: number;
            startDate: Date;
        } | null;
        modules: {
            status: import(".prisma/client").$Enums.ModuleStatus;
            isActive: boolean;
            deadline: Date;
            startedAt: Date | null;
            completedAt: Date | null;
            id: string;
            createdAt: Date;
            title: string;
            description: string;
            order: number;
            durationMinutes: number;
            deadlineDays: number;
            mediaType: import(".prisma/client").$Enums.ModuleMediaType;
            mediaUrl: string;
            createdById: string;
        }[];
        progress: {
            completedCount: number;
            totalModules: number;
            allCompleted: boolean;
            issuedAt: Date | null;
        };
        lastCompletedModule: {
            id: string;
            title: string;
            order: number;
        } | null;
        certificate: {
            issuedTo: string;
            issuedEmail: string;
            issuedAt: Date;
            program: string;
        } | null;
    } | null>;
}
