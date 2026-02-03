import { PrismaService } from '../prisma/prisma.service';
export declare class ProgressService {
    private prisma;
    constructor(prisma: PrismaService);
    getCompletionSummary(userId: string): Promise<{
        completedCount: number;
        totalModules: number;
        allCompleted: boolean;
    }>;
}
