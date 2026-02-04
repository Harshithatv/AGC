import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { UploadModuleFileDto } from './dto/upload-module-file.dto';
import { ModulesService } from './modules.service';
export declare class ModulesController {
    private modulesService;
    constructor(modulesService: ModulesService);
    listPublic(): Promise<any>;
    listForUser(user: {
        id: string;
        organizationId?: string;
    }): Promise<any>;
    startModule(user: {
        id: string;
    }, moduleId: string): Promise<any>;
    completeModule(user: {
        id: string;
    }, moduleId: string): Promise<any>;
    listAll(): Promise<any>;
    createModule(user: {
        id: string;
    }, body: CreateModuleDto): Promise<any>;
    uploadFile(file: Express.Multer.File, body: UploadModuleFileDto): Promise<{
        url: string;
    }>;
    updateModule(id: string, body: UpdateModuleDto): Promise<any>;
    deleteModule(id: string): Promise<any>;
}
