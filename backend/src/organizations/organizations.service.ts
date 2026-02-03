import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async getOrganizationWithStats(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        purchases: { orderBy: { purchasedAt: 'desc' }, take: 1 }
      }
    });

    if (!organization) {
      return null;
    }

    const userCount = await this.prisma.user.count({
      where: { organizationId }
    });

    const modules = await this.prisma.courseModule.findMany({
      orderBy: { order: 'asc' }
    });

    const moduleDeadlines = modules.map((moduleItem) => {
      const deadline = new Date(organization.startDate);
      deadline.setDate(deadline.getDate() + moduleItem.deadlineDays * moduleItem.order);

      return {
        id: moduleItem.id,
        title: moduleItem.title,
        order: moduleItem.order,
        deadline
      };
    });

    return {
      ...organization,
      userCount,
      moduleDeadlines
    };
  }
}
