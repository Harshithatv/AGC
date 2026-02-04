import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { UploadModuleFileDto } from './dto/upload-module-file.dto';
import { ModulesService } from './modules.service';
export declare class ModulesController {
    private modulesService;
    constructor(modulesService: ModulesService);
    listPublic(): Promise<{
        id: string;
        title: string;
        description: string;
        order: number;
        durationMinutes: number;
    }[]>;
    listForUser(user: {
        id: string;
        organizationId?: string;
    }): Promise<{
        status: import(".prisma/client").$Enums.ModuleStatus;
        isActive: boolean;
        deadline: Date;
        startedAt: Date | null;
        completedAt: Date | null;
        id: string;
        title: string;
        description: string;
        order: number;
        durationMinutes: number;
        deadlineDays: number;
        mediaType: import(".prisma/client").$Enums.ModuleMediaType;
        mediaUrl: string;
        createdAt: Date;
        createdById: string;
    }[]>;
    startModule(user: {
        id: string;
    }, moduleId: string): Promise<{
        id: string;
        userId: string;
        moduleId: string;
        status: import(".prisma/client").$Enums.ModuleStatus;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    completeModule(user: {
        id: string;
    }, moduleId: string): Promise<{
        id: string;
        userId: string;
        moduleId: string;
        status: import(".prisma/client").$Enums.ModuleStatus;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    listAll(): Promise<{
        id: string;
        title: string;
        description: string;
        order: number;
        durationMinutes: number;
        deadlineDays: number;
        mediaType: import(".prisma/client").$Enums.ModuleMediaType;
        mediaUrl: string;
        createdAt: Date;
        createdById: string;
    }[]>;
    createModule(user: {
        id: string;
    }, body: CreateModuleDto): Promise<{
        id: string;
        title: string;
        description: string;
        order: number;
        durationMinutes: number;
        deadlineDays: number;
        mediaType: import(".prisma/client").$Enums.ModuleMediaType;
        mediaUrl: string;
        createdAt: Date;
        createdById: string;
    }>;
    uploadFile(file: Express.Multer.File, body: UploadModuleFileDto): Promise<{
        url: string;
    }>;
    updateModule(id: string, body: UpdateModuleDto): Promise<{
        id: string;
        title: string;
        description: string;
        order: number;
        durationMinutes: number;
        deadlineDays: number;
        mediaType: import(".prisma/client").$Enums.ModuleMediaType;
        mediaUrl: string;
        createdAt: Date;
        createdById: string;
    }>;
    deleteModule(id: string): Promise<{
        id: string;
        title: string;
        description: string;
        order: number;
        durationMinutes: number;
        deadlineDays: number;
        mediaType: import(".prisma/client").$Enums.ModuleMediaType;
        mediaUrl: string;
        createdAt: Date;
        createdById: string;
    }>;
}
