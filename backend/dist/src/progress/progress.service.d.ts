import { PrismaService } from '../prisma/prisma.service';
export declare class ProgressService {
    private prisma;
    constructor(prisma: PrismaService);
    getCompletionSummary(userId: string): Promise<{
        completedCount: any;
        totalModules: any;
        allCompleted: boolean;
    }>;
}
