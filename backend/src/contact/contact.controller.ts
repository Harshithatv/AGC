import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  // Public endpoint – anyone can submit a contact message
  @Post()
  async submitMessage(@Body() body: CreateContactDto) {
    await this.contactService.createMessage({
      name: body.name,
      email: body.email,
      message: body.message,
    });
    return { success: true, message: 'Your message has been sent successfully.' };
  }

  // Admin-only endpoints
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async listMessages() {
    return this.contactService.listMessages();
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async getUnreadCount() {
    const count = await this.contactService.getUnreadCount();
    return { count };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async markAsRead(@Param('id') id: string) {
    return this.contactService.markAsRead(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN)
  async deleteMessage(@Param('id') id: string) {
    return this.contactService.deleteMessage(id);
  }
}
