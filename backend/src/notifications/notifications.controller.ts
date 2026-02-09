import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: { id: string; role: string; organizationId?: string },
  ) {
    return this.notificationsService.listForUser(user.role, user.organizationId);
  }

  @Get('unread-count')
  async unreadCount(
    @CurrentUser() user: { id: string; role: string; organizationId?: string },
  ) {
    const count = await this.notificationsService.getUnreadCount(user.role, user.organizationId);
    return { count };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('mark-all-read')
  async markAllRead(
    @CurrentUser() user: { id: string; role: string; organizationId?: string },
  ) {
    await this.notificationsService.markAllAsRead(user.role, user.organizationId);
    return { success: true };
  }
}
