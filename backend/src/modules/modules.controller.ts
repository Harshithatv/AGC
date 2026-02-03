import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { UploadModuleFileDto } from './dto/upload-module-file.dto';
import { ModulesService } from './modules.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

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
  async createModule(@CurrentUser() user: { id: string }, @Body() body: CreateModuleDto) {
    return this.modulesService.createModule({
      title: body.title,
      description: body.description,
      order: body.order,
      durationMinutes: body.durationMinutes,
      deadlineDays: body.deadlineDays,
      mediaType: body.mediaType,
      mediaUrl: body.mediaUrl,
      createdById: user.id
    });
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async () => ({
          folder: 'agc-modules',
          resource_type: 'auto'
        })
      })
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: UploadModuleFileDto) {
    const url = (file as Express.Multer.File & { path?: string }).path || '';
    if (body?.moduleId) {
      await this.modulesService.updateModule(body.moduleId, {
        mediaType: body.mediaType,
        mediaUrl: url
      });
    }
    return { url };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async updateModule(@Param('id') id: string, @Body() body: UpdateModuleDto) {
    return this.modulesService.updateModule(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async deleteModule(@Param('id') id: string) {
    return this.modulesService.deleteModule(id);
  }
}
