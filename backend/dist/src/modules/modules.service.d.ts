import { PrismaService } from '../prisma/prisma.service';
export declare class ModulesService {
    private prisma;
    constructor(prisma: PrismaService);
    listPublicModules(): Promise<{
        id: string;
        title: string;
        description: string;
        order: number;
        durationMinutes: number;
    }[]>;
    listAllModules(): Promise<{
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
    }[]>;
    createModule(params: {
        title: string;
        description: string;
        order: number;
        durationMinutes: number;
        deadlineDays: number;
        mediaType: 'VIDEO' | 'PRESENTATION';
        mediaUrl: string;
        createdById: string;
    }): Promise<{
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
    }>;
    updateModule(id: string, updates: Partial<{
        title: string;
        description: string;
        order: number;
        durationMinutes: number;
        deadlineDays: number;
        mediaType: 'VIDEO' | 'PRESENTATION';
        mediaUrl: string;
    }>): Promise<{
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
    }>;
    deleteModule(id: string): Promise<{
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
    }>;
    getModulesForUser(userId: string, organizationId: string): Promise<{
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
    }[]>;
    startModule(userId: string, moduleId: string): Promise<{
        id: string;
        moduleId: string;
        userId: string;
        status: import(".prisma/client").$Enums.ModuleStatus;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    completeModule(userId: string, moduleId: string): Promise<{
        id: string;
        moduleId: string;
        userId: string;
        status: import(".prisma/client").$Enums.ModuleStatus;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
}
