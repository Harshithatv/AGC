import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [ProgressModule],
  providers: [OrganizationsService],
  controllers: [OrganizationsController],
  exports: [OrganizationsService]
})
export class OrganizationsModule {}
