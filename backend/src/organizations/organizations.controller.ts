import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Get('me')
  async getMyOrganization(@CurrentUser() user: { organizationId?: string }) {
    if (!user.organizationId) {
      return null;
    }

    return this.organizationsService.getOrganizationWithStats(user.organizationId);
  }
}
