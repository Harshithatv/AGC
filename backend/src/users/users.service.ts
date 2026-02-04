import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationType, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ModulesService } from '../modules/modules.service';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private modulesService: ModulesService,
    private progressService: ProgressService
  ) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async listByOrganization(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId, role: Role.ORG_USER },
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
      where: { organizationId: params.organizationId, role: Role.ORG_USER }
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
      where: { organizationId: params.organizationId, role: Role.ORG_USER }
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

  async getOrgUserProgressDetails(organizationId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, role: Role.ORG_USER },
      select: { id: true, name: true, email: true, role: true, organizationId: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [organization, modules, summary] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: organizationId } }),
      this.modulesService.getModulesForUser(user.id, organizationId),
      this.progressService.getCompletionSummary(user.id)
    ]);

    const lastCompleted = [...modules]
      .filter((moduleItem) => moduleItem.status === 'COMPLETED')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .pop();

    return {
      user,
      organization,
      modules,
      progress: summary,
      lastCompletedModule: lastCompleted
        ? { id: lastCompleted.id, title: lastCompleted.title, order: lastCompleted.order }
        : null,
      certificate: summary.allCompleted
        ? {
            issuedTo: user.name,
            issuedEmail: user.email,
            issuedAt: summary.issuedAt ?? new Date(),
            program: 'Academic Guide Course & Certification'
          }
        : null
    };
  }
}
