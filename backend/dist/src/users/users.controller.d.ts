import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { BulkUsersDto } from './dto/bulk-users.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    listUsers(user: {
        organizationId?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
    createUser(user: {
        organizationId?: string;
    }, body: CreateUserDto): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        organizationId: string | null;
    }>;
    bulkCreate(user: {
        organizationId?: string;
    }, body: BulkUsersDto): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
}
