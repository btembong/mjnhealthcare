import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PublicReferralService } from './public-referral.service';

@Controller('public-referral')
export class PublicReferralController {
  constructor(private readonly service: PublicReferralService) {}

  // ── Public (no auth) ──────────────────────────────────────────────────────

  @Post('signup')
  signup(@Body() dto: { name: string; email?: string; phone?: string }) {
    return this.service.signup(dto);
  }

  @Get('status/:code')
  status(@Param('code') code: string) {
    return this.service.getStatus(code);
  }

  // ── Admin (JWT required) ──────────────────────────────────────────────────

  @Get('admin/list')
  @UseGuards(JwtAuthGuard)
  list() {
    return this.service.adminList();
  }

  @Patch('admin/:id/mark-paid')
  @UseGuards(JwtAuthGuard)
  markPaid(@Param('id') id: string) {
    return this.service.adminMarkPaid(id);
  }

  @Delete('admin/:id/void')
  @UseGuards(JwtAuthGuard)
  void(@Param('id') id: string) {
    return this.service.adminVoid(id);
  }
}
