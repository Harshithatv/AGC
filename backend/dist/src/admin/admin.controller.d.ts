import { AdminService } from './admin.service';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    bootstrap(key: string, body: BootstrapAdminDto): Promise<any>;
    listOrganizations(): Promise<any[]>;
    listPurchases(): Promise<any>;
    listPricing(): Promise<any>;
    updatePricing(body: UpdatePricingDto): Promise<any>;
}
