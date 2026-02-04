import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ModulesModule } from '../modules/modules.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [ModulesModule, ProgressModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
