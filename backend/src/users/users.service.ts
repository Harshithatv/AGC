import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationType, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async listByOrganization(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
  }

  async createUser(params: {
    organizationId: string;
    name: string;
    email: string;
    password: string;
    role?: Role;
  }) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: params.organizationId }
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const currentCount = await this.prisma.user.count({
      where: { organizationId: params.organizationId }
    });

    if (currentCount >= organization.maxUsers) {
      throw new BadRequestException('User limit reached for this package');
    }

    if (organization.type === OrganizationType.SINGLE && currentCount >= 1) {
      throw new BadRequestException('Single user package supports only one user');
    }

    const passwordHash = await bcrypt.hash(params.password, 10);

    return this.prisma.user.create({
      data: {
        name: params.name,
        email: params.email,
        passwordHash,
        role: params.role ?? Role.ORG_USER,
        organizationId: params.organizationId
      },
      select: { id: true, name: true, email: true, role: true, organizationId: true }
    });
  }

  async bulkCreateUsers(params: {
    organizationId: string;
    users: Array<{ name: string; email: string; password: string }>;
  }) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: params.organizationId }
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const currentCount = await this.prisma.user.count({
      where: { organizationId: params.organizationId }
    });

    if (currentCount + params.users.length > organization.maxUsers) {
      throw new BadRequestException('User limit exceeded for this package');
    }

    const data = await Promise.all(
      params.users.map(async (user) => ({
        name: user.name,
        email: user.email,
        passwordHash: await bcrypt.hash(user.password, 10),
        role: Role.ORG_USER,
        organizationId: params.organizationId
      }))
    );

    await this.prisma.user.createMany({ data });

    return this.listByOrganization(params.organizationId);
  }
}
