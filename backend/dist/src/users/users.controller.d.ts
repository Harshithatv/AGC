import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { BulkUsersDto } from './dto/bulk-users.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    listUsers(user: {
        organizationId?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
    createUser(user: {
        organizationId?: string;
    }, body: CreateUserDto): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        organizationId: string | null;
    }>;
    bulkCreate(user: {
        organizationId?: string;
    }, body: BulkUsersDto): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
    getUserProgress(user: {
        organizationId?: string;
    }, id: string): Promise<{
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
    }>;
}
