import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private purchasesService;
    constructor(purchasesService: PurchasesService);
    pricing(): Promise<any>;
    create(body: CreatePurchaseDto): Promise<any>;
}
