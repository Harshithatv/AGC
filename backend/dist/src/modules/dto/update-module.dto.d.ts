import { ModuleMediaType } from '@prisma/client';
export declare class UpdateModuleDto {
    title?: string;
    description?: string;
    order?: number;
    durationMinutes?: number;
    deadlineDays?: number;
    mediaType?: ModuleMediaType;
    mediaUrl?: string;
}
