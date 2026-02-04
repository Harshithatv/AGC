import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ModulesService } from '../modules/modules.service';
import { ProgressService } from '../progress/progress.service';
export declare class UsersService {
    private prisma;
    private modulesService;
    private progressService;
    constructor(prisma: PrismaService, modulesService: ModulesService, progressService: ProgressService);
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        name: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        organizationId: string | null;
        createdAt: Date;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        email: string;
        name: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        organizationId: string | null;
        createdAt: Date;
    } | null>;
    listByOrganization(organizationId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
    createUser(params: {
        organizationId: string;
        name: string;
        email: string;
        password: string;
        role?: Role;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        organizationId: string | null;
    }>;
    bulkCreateUsers(params: {
        organizationId: string;
        users: Array<{
            name: string;
            email: string;
            password: string;
        }>;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
    getOrgUserProgressDetails(organizationId: string, userId: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
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
    }>;
}
