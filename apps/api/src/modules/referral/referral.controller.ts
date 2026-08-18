import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReferralService } from './referral.service';

@Controller('referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly svc: ReferralService) {}

  /** GET /referral/my-code — get or auto-create the caller's referral code */
  @Get('my-code')
  getMyCode(@Request() req: any) {
    return this.svc.getMyCode(req.user.sub);
  }

  /** GET /referral/my-referrals — list people I referred + reward status */
  @Get('my-referrals')
  getMyReferrals(@Request() req: any) {
    return this.svc.getMyReferrals(req.user.sub);
  }

  /** POST /referral/track — called at signup to record which code was used */
  @Post('track')
  track(@Request() req: any, @Body() body: { code: string }) {
    return this.svc.trackReferral(body.code, req.user.sub);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** GET /referral/admin/codes */
  @Get('admin/codes')
  getAllCodes(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.svc.getAllCodes(Number(page), Number(limit));
  }

  /** PATCH /referral/admin/codes/:id/void */
  @Patch('admin/codes/:id/void')
  voidCode(@Param('id') id: string) {
    return this.svc.voidCode(id);
  }
}
