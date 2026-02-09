import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(params: {
    type: string;
    title: string;
    message: string;
    recipientRole: string;
    recipientOrgId?: string;
    link?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        recipientRole: params.recipientRole,
        recipientOrgId: params.recipientOrgId || null,
        link: params.link || null,
      },
    });
  }

  async listForUser(role: string, organizationId?: string | null) {
    const where: any = { recipientRole: role };

    // ORG_ADMIN only sees notifications for their own org
    if (role === 'ORG_ADMIN' && organizationId) {
      where.recipientOrgId = organizationId;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(role: string, organizationId?: string | null) {
    const where: any = { recipientRole: role, read: false };

    if (role === 'ORG_ADMIN' && organizationId) {
      where.recipientOrgId = organizationId;
    }

    return this.prisma.notification.count({ where });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(role: string, organizationId?: string | null) {
    const where: any = { recipientRole: role, read: false };

    if (role === 'ORG_ADMIN' && organizationId) {
      where.recipientOrgId = organizationId;
    }

    return this.prisma.notification.updateMany({
      where,
      data: { read: true },
    });
  }
}
