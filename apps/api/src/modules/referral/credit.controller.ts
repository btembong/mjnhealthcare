import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditService } from './credit.service';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditController {
  constructor(private readonly svc: CreditService) {}

  /** GET /credits/wallet — caller's wallet + last 50 transactions */
  @Get('wallet')
  getWallet(@Request() req: any) {
    return this.svc.getWallet(req.user.id);
  }

  /** GET /credits/preview?subtotalCents=X — how much can I apply at checkout */
  @Get('preview')
  preview(@Request() req: any, @Query('subtotalCents') subtotal: string) {
    return this.svc.previewSpend(req.user.id, Number(subtotal));
  }

  /** POST /credits/transfer — send credits to another user */
  @Post('transfer')
  transfer(
    @Request() req: any,
    @Body() body: { toPersonId: string; amountCents: number; note?: string },
  ) {
    return this.svc.transferCredits(req.user.id, body.toPersonId, body.amountCents, body.note, req.user.id);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** GET /credits/admin/wallets */
  @Get('admin/wallets')
  getAllWallets(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.svc.getAllWallets(Number(page), Number(limit));
  }

  /** POST /credits/admin/adjust — manually grant or deduct credits */
  @Post('admin/adjust')
  adminAdjust(@Request() req: any, @Body() body: { personId: string; amountCents: number; reason: string }) {
    return this.svc.adminAdjust(body.personId, body.amountCents, body.reason, req.user.id);
  }
}
