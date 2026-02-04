import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { BulkUsersDto } from './dto/bulk-users.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    listUsers(user: {
        organizationId?: string;
    }): Promise<any>;
    createUser(user: {
        organizationId?: string;
    }, body: CreateUserDto): Promise<any>;
    bulkCreate(user: {
        organizationId?: string;
    }, body: BulkUsersDto): Promise<any>;
}
