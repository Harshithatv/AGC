import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

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
      where: { organizationId, role: Role.ORG_USER }
    });

    return {
      ...organization,
      userCount
    };
  }
}
