import { OrganizationsService } from './organizations.service';
export declare class OrganizationsController {
    private organizationsService;
    constructor(organizationsService: OrganizationsService);
    getMyOrganization(user: {
        organizationId?: string;
    }): Promise<any>;
}
