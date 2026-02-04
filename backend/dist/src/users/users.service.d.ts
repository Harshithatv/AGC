import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<any>;
    findById(id: string): Promise<any>;
    listByOrganization(organizationId: string): Promise<any>;
    createUser(params: {
        organizationId: string;
        name: string;
        email: string;
        password: string;
        role?: Role;
    }): Promise<any>;
    bulkCreateUsers(params: {
        organizationId: string;
        users: Array<{
            name: string;
            email: string;
            password: string;
        }>;
    }): Promise<any>;
}
