import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ModulesModule } from '../modules/modules.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [ModulesModule, ProgressModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}
