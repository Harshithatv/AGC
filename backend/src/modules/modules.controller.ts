import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards, UseInterceptors, UploadedFile, UsePipes, ValidationPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UpdateModuleDto } from './dto/update-module.dto';
import { UploadModuleFileDto } from './dto/upload-module-file.dto';
import { ModulesService } from './modules.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

@Controller('modules')
export class ModulesController {
  constructor(private modulesService: ModulesService) {}

  @Get('public')
  async listPublic() {
    return this.modulesService.listPublicModules();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async listForUser(@CurrentUser() user: { id: string; organizationId?: string }) {
    return this.modulesService.getModulesForUser(user.id, user.organizationId as string);
  }

  @Post('me/:id/start')
  @UseGuards(JwtAuthGuard)
  async startModule(@CurrentUser() user: { id: string }, @Param('id') moduleId: string) {
    return this.modulesService.startModule(user.id, moduleId);
  }

  @Post('me/:id/complete')
  @UseGuards(JwtAuthGuard)
  async completeModule(@CurrentUser() user: { id: string }, @Param('id') moduleId: string) {
    return this.modulesService.completeModule(user.id, moduleId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async listAll() {
    return this.modulesService.listAllModules();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  )
  async createModule(@CurrentUser() user: { id: string }, @Body() body: any, @Req() req: any) {
    console.warn('CreateModule content-type', req?.headers?.['content-type']);
    let source: any = body?.payload ?? body?.data ?? body ?? {};
    if (typeof source === 'string') {
      try {
        source = JSON.parse(source);
      } catch {
        source = {};
      }
    }
    if (Buffer.isBuffer(source)) {
      try {
        source = JSON.parse(source.toString('utf8'));
      } catch {
        source = {};
      }
    }
    if (!source || Object.keys(source).length === 0) {
      source = req?.body ?? {};
    }
    console.warn('CreateModule raw body', source);

    const payload = {
      title: String(source?.title ?? '').trim(),
      description: String(source?.description ?? '').trim(),
      order: Number(source?.order),
      deadlineDays: Number(source?.deadlineDays),
      mediaType: String(source?.mediaType ?? '').trim(),
      mediaUrl: String(source?.mediaUrl ?? '').trim(),
      files: Array.isArray(source?.files)
        ? source.files.map((file: any) => ({
            order: Number(file?.order),
            title: typeof file?.title === 'string' ? file.title.trim() : '',
            mediaType: String(file?.mediaType ?? '').trim(),
            mediaUrl: String(file?.mediaUrl ?? '').trim()
          }))
        : []
    };

   

    if (!payload.title || !payload.description) {
      throw new BadRequestException('Title and description are required');
    }
    if (!Number.isInteger(payload.order) || payload.order < 1) {
      throw new BadRequestException('Order must be a whole number greater than 0');
    }
    if (!Number.isInteger(payload.deadlineDays) || payload.deadlineDays < 1) {
      throw new BadRequestException('Deadline must be a whole number greater than 0');
    }
    const allowedTypes = ['VIDEO', 'PDF'];
    const sanitizedFiles = payload.files.filter((file: any) => file?.mediaUrl);
    if (sanitizedFiles.length > 0) {
      const invalidFile = sanitizedFiles.find((file: any) => !allowedTypes.includes(file.mediaType));
      if (invalidFile) {
        throw new BadRequestException('File media type must be VIDEO or PDF');
      }
      const invalidOrder = sanitizedFiles.find((file: any) => !Number.isInteger(file.order) || file.order < 1);
      if (invalidOrder) {
        throw new BadRequestException('File order must be a whole number greater than 0');
      }
    }

    if (!payload.mediaUrl && sanitizedFiles.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const primaryFile = sanitizedFiles[0];
    if (!payload.mediaUrl && primaryFile) {
      payload.mediaUrl = primaryFile.mediaUrl;
    }
    if (!payload.mediaType && primaryFile) {
      payload.mediaType = primaryFile.mediaType;
    }

    if (!allowedTypes.includes(payload.mediaType)) {
      throw new BadRequestException('Media type must be VIDEO or PDF');
    }
    if (!payload.mediaUrl) {
      throw new BadRequestException('Media URL is required');
    }

    return this.modulesService.createModule({
      title: payload.title,
      description: payload.description,
      order: payload.order,
      deadlineDays: payload.deadlineDays,
      mediaType: payload.mediaType as 'VIDEO' | 'PRESENTATION' | 'PDF' | 'DOCUMENT',
      mediaUrl: payload.mediaUrl,
      createdById: user.id,
      files: sanitizedFiles.map((file: any) => ({
        order: file.order,
        title: file.title || null,
        mediaType: file.mediaType,
        mediaUrl: file.mediaUrl
      }))
    });
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
          const bodyMediaType = req?.body?.mediaType;
          const mime = file?.mimetype?.toLowerCase() || '';
          const isPdf =
            bodyMediaType === 'PDF' ||
            mime.includes('pdf');

          let parsed: path.ParsedPath | undefined;
          if (file?.originalname) {
            try {
              parsed = path.parse(file.originalname);
            } catch {
              parsed = undefined;
            }
          }
          const fallbackName =
            file?.fieldname ||
            bodyMediaType ||
            (isPdf ? 'document' : 'video');
          const safeBase = ((parsed?.name as string | undefined) || 'document')
            .replace(/[^a-zA-Z0-9-_]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase();
          const ext = (parsed?.ext || '').replace('.', '').toLowerCase();
          const base = safeBase || String(fallbackName).toLowerCase();
          const publicId = isPdf && ext ? `${base}-${Date.now()}.${ext}` : undefined;

          return {
            folder: 'agc-modules',
            resource_type: isPdf ? 'raw' : 'video',
            type: 'upload',
            access_mode: 'public',
            public_id: publicId
          };
        }
      })
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: UploadModuleFileDto) {
    const url = (file as Express.Multer.File & { path?: string }).path || '';
    if (body?.moduleId) {
      let inferredTitle = body.title;
      if (!inferredTitle && file?.originalname) {
        try {
          inferredTitle = path.parse(file.originalname).name;
        } catch {
          inferredTitle = undefined;
        }
      }
      await this.modulesService.addModuleFile({
        moduleId: body.moduleId,
        order: body.order,
        title: inferredTitle,
        mediaType: (body.mediaType || 'PDF') as 'VIDEO' | 'PRESENTATION' | 'PDF' | 'DOCUMENT',
        mediaUrl: url
      });
    }
    return { url };
  }

  @Post(':id/files/:fileId/start')
  @UseGuards(JwtAuthGuard)
  async startModuleFile(
    @CurrentUser() user: { id: string },
    @Param('id') moduleId: string,
    @Param('fileId') fileId: string
  ) {
    return this.modulesService.startModuleFile(user.id, moduleId, fileId);
  }

  @Post(':id/files/:fileId/complete')
  @UseGuards(JwtAuthGuard)
  async completeModuleFile(
    @CurrentUser() user: { id: string },
    @Param('id') moduleId: string,
    @Param('fileId') fileId: string
  ) {
    return this.modulesService.completeModuleFile(user.id, moduleId, fileId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async updateModule(@Param('id') id: string, @Body() body: UpdateModuleDto) {
    const { filesToAdd, ...rest } = body;
    const updated = await this.modulesService.updateModule(id, rest);
    if (filesToAdd?.length) {
      await this.modulesService.addModuleFiles(id, filesToAdd as any);
    }
    return updated;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async deleteModule(@Param('id') id: string) {
    return this.modulesService.deleteModule(id);
  }

  @Delete(':id/files/:fileId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async deleteModuleFile(@Param('id') moduleId: string, @Param('fileId') fileId: string) {
    return this.modulesService.deleteModuleFile(moduleId, fileId);
  }
}
