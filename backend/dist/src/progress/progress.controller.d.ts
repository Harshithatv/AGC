import { ProgressService } from './progress.service';
export declare class ProgressController {
    private progressService;
    constructor(progressService: ProgressService);
    certificateStatus(user: {
        id: string;
        name: string;
        email: string;
    }): Promise<{
        certificate: {
            issuedTo: string;
            issuedEmail: string;
            issuedAt: Date;
            program: string;
        } | null;
        completedCount: number;
        totalModules: number;
        allCompleted: boolean;
        issuedAt: Date | null;
    }>;
}
