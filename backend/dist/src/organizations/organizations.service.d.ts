import { PrismaService } from '../prisma/prisma.service';
export declare class OrganizationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getOrganizationWithStats(organizationId: string): Promise<any>;
}
