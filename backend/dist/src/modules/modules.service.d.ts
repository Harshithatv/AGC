import { PrismaService } from '../prisma/prisma.service';
export declare class ModulesService {
    private prisma;
    constructor(prisma: PrismaService);
    listPublicModules(): Promise<any>;
    listAllModules(): Promise<any>;
    createModule(params: {
        title: string;
        description: string;
        order: number;
        durationMinutes: number;
        deadlineDays: number;
        mediaType: 'VIDEO' | 'PRESENTATION';
        mediaUrl: string;
        createdById: string;
    }): Promise<any>;
    updateModule(id: string, updates: Partial<{
        title: string;
        description: string;
        order: number;
        durationMinutes: number;
        deadlineDays: number;
        mediaType: 'VIDEO' | 'PRESENTATION';
        mediaUrl: string;
    }>): Promise<any>;
    deleteModule(id: string): Promise<any>;
    getModulesForUser(userId: string, organizationId: string): Promise<any>;
    startModule(userId: string, moduleId: string): Promise<any>;
    completeModule(userId: string, moduleId: string): Promise<any>;
}
