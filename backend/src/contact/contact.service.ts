import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ContactService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async createMessage(params: { name: string; email: string; message: string }) {
    const msg = await this.prisma.contactMessage.create({
      data: {
        name: params.name,
        email: params.email,
        message: params.message,
      },
    });

    // Notify system admin about new contact message
    this.notificationsService.create({
      type: 'CONTACT_MESSAGE',
      title: 'New contact message',
      message: `${params.name} (${params.email}) sent a support message.`,
      recipientRole: 'SYSTEM_ADMIN',
      link: `/dashboard/contacts`,
    }).catch(() => {});

    return msg;
  }

  async listMessages() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
  }

  async deleteMessage(id: string) {
    return this.prisma.contactMessage.delete({
      where: { id },
    });
  }

  async getUnreadCount() {
    return this.prisma.contactMessage.count({
      where: { read: false },
    });
  }
}
