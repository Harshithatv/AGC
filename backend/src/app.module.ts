import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ModulesModule } from './modules/modules.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PurchasesModule } from './purchases/purchases.module';
import { UsersModule } from './users/users.module';
import { ProgressModule } from './progress/progress.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';
import { ContactModule } from './contact/contact.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EmailModule,
    NotificationsModule,
    AuthModule,
    PurchasesModule,
    OrganizationsModule,
    UsersModule,
    ModulesModule,
    ProgressModule,
    AdminModule,
    ContactModule
  ]
})
export class AppModule {}
