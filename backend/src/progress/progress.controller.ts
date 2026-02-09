import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ProgressService } from './progress.service';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Get('certificate')
  async certificateStatus(@CurrentUser() user: { id: string; name: string; email: string }) {
    const summary = await this.progressService.getCompletionSummary(user.id);

    return {
      ...summary,
      certificate: summary.allCompleted
        ? {
            issuedTo: user.name,
            issuedEmail: user.email,
            issuedAt: summary.issuedAt ?? new Date(),
            program: 'Academic Guide Training & Certification'
          }
        : null
    };
  }
}
