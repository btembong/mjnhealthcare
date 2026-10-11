import { CurrentUser, AuthUser, isConsultant } from '../auth/access';
import { AccessService } from '../auth/access.service';
import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, Req, HttpCode, HttpStatus, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ConsultationService } from './consultation.service';
import {
  BookConsultationDto,
  CancelConsultationDto,
  CreateConsultantDto,
  UpdateConsultantDto,
  CreateSlotDto,
  CreateSlotsDto,
  SubmitApplicationDto,
  ReviewApplicationDto,
  MarkPayoutPaidDto,
  HoldSlotDto,
  CreateAvailabilityRuleDto,
  CreateBlockedTimeDto,
} from './consultation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('consultations')
@Controller('consultations')
export class ConsultationController {
  constructor(
    private readonly svc: ConsultationService,
    private readonly access: AccessService,
  ) {}

  /** A consultant acts only on their own sessions; an admin on any. */
  private async assertOwnSession(user: AuthUser, bookingId: string) {
    const consultantId = await this.svc.bookingConsultantId(bookingId);
    if (!isConsultant(user)) return;
    if (!(await this.access.consultantIds(user)).has(consultantId)) {
      throw new ForbiddenException('You do not have access to this record.');
    }
  }

  // ── Public ──────────────────────────────────────────────────────────────────

  @Get('consultants')
  listConsultants(@Query('category') category?: string) {
    return this.svc.listConsultants(category);
  }

  @Get('slots/:consultantId')
  getSlots(@Param('consultantId') consultantId: string) {
    return this.svc.getAvailableSlots(consultantId);
  }

  @Post('book')
  initiateBooking(@Body() dto: BookConsultationDto) {
    return this.svc.initiateBooking(dto);
  }

  @Post('partners/apply')
  submitApplication(@Body() dto: SubmitApplicationDto) {
    return this.svc.submitApplication(dto);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  cancelBooking(@Body() dto: CancelConsultationDto) {
    return this.svc.cancelBooking(dto.bookingId, dto.clientEmail);
  }

  @Get('join/:bookingId')
  getJoinInfo(
    @Param('bookingId') bookingId: string,
    @Query('email') email: string,
  ) {
    return this.svc.getJoinInfo(bookingId, email);
  }

  @Get('booking/:id')
  getBookingSummary(@Param('id') id: string) {
    return this.svc.getBookingSummary(id);
  }

  // ── Logged-in client: their own sessions ─────────────────────────────────
  // These act on the account's own email, so nothing has to be typed or guessed.

  @UseGuards(JwtAuthGuard)
  @Get('my/:id/cancel-preview')
  async myCancelPreview(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.cancelPreview(id, await this.svc.emailOf(user.id));
  }

  @UseGuards(JwtAuthGuard)
  @Post('my/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async myCancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.cancelBooking(id, await this.svc.emailOf(user.id));
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/:id/join')
  async myJoin(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.svc.getJoinInfo(id, await this.svc.emailOf(user.id));
  }

  @UseGuards(JwtAuthGuard)
  @Post('my/:id/reschedule')
  @HttpCode(HttpStatus.OK)
  async myReschedule(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { slotId: string }) {
    return this.svc.rescheduleBooking(id, await this.svc.emailOf(user.id), String(body?.slotId ?? ''));
  }

  @UseGuards(JwtAuthGuard)
  @Get('client/:email')
  async getClientBookings(@CurrentUser() user: AuthUser, @Param('email') email: string) {
    await this.access.assertOwnEmail(user, email);
    return this.svc.getClientBookings(email);
  }

  @Post('slots/:slotId/hold')
  @HttpCode(HttpStatus.OK)
  holdSlot(@Param('slotId') slotId: string, @Body() dto: HoldSlotDto) {
    return this.svc.holdSlot(slotId, dto.clientEmail);
  }

  /**
   * Asks the payment provider whether this booking has been paid and confirms it if so.
   * Open to anyone, like the booking page itself: it can only confirm a booking the provider
   * reports as paid, so calling it for someone else's booking gains nothing.
   */
  @Post('booking/:id/verify-payment')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Param('id') id: string) {
    try {
      return { status: await this.svc.verifyBookingPayment(id) };
    } catch {
      return { status: 'pending' };
    }
  }

  // Tranzak notice — open to anyone, so nothing in it is trusted: the booking is looked up with Tranzak directly
  @Post('webhook/payment')
  @HttpCode(HttpStatus.OK)
  paymentWebhook(@Body() payload: any) {
    return this.svc.handlePaymentWebhook(payload);
  }

  // Stripe webhook — no auth, verified via stripe-signature header
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(@Req() req: any) {
    const sig = req.headers['stripe-signature'] ?? '';
    await this.svc.handleStripeWebhook(req.rawBody ?? Buffer.alloc(0), sig);
    return { received: true };
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT', 'PROCESSING_OFFICER')
  @Get('admin/consultants')
  listAll(@Query('activeOnly') activeOnly?: string) {
    return this.svc.listAllConsultants(activeOnly === 'true');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/consultants')
  createConsultant(@Body() dto: CreateConsultantDto) {
    return this.svc.createConsultant(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/consultants/:id')
  updateConsultant(@Param('id') id: string, @Body() dto: UpdateConsultantDto) {
    return this.svc.updateConsultant(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post('admin/slots')
  createSlot(@Body() dto: CreateSlotDto) {
    return this.svc.createSlot(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post('admin/slots/bulk')
  createSlotsBulk(@Body() dto: CreateSlotsDto) {
    return this.svc.createSlotsBulk(dto.slots);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Get('admin/consultants/:id/slots')
  getConsultantSlots(@Param('id') id: string) {
    return this.svc.getConsultantSlots(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Delete('admin/slots/:slotId')
  deleteSlot(@Param('slotId') slotId: string) {
    return this.svc.deleteSlot(slotId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/consultants/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivateConsultant(@Param('id') id: string) {
    return this.svc.deactivateConsultant(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/consultants/:id/reactivate')
  @HttpCode(HttpStatus.OK)
  reactivateConsultant(@Param('id') id: string) {
    return this.svc.reactivateConsultant(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/consultants/:id')
  @HttpCode(HttpStatus.OK)
  deleteConsultant(@Param('id') id: string) {
    return this.svc.deleteConsultant(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Get('admin/sessions')
  async listSessions(@CurrentUser() user: AuthUser, @Query('consultantId') consultantId?: string, @Query('status') status?: string) {
    // A consultant sees their own sessions only, whatever the request asks for.
    const own = isConsultant(user) ? [...(await this.access.consultantIds(user))] : null;
    return this.svc.listSessions(own, consultantId, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Get('admin/bookings/:id/join')
  async getHostJoinInfo(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.assertOwnSession(user, id);
    return this.svc.getHostJoinInfo(id, user.email ?? 'Consultant');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post('admin/bookings/:id/complete')
  @HttpCode(HttpStatus.OK)
  async markCompleted(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { caseNote?: string }) {
    await this.assertOwnSession(user, id);
    return this.svc.markCompleted(id, body?.caseNote);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post('admin/bookings/:id/reschedule')
  @HttpCode(HttpStatus.OK)
  async staffReschedule(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { slotId: string }) {
    await this.assertOwnSession(user, id);
    return this.svc.rescheduleByStaff(id, String(body?.slotId ?? ''));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post('admin/bookings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async staffCancel(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { reason: string }) {
    await this.assertOwnSession(user, id);
    return this.svc.cancelByStaff(id, String(body?.reason ?? ''));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post('admin/bookings/:id/no-show')
  @HttpCode(HttpStatus.OK)
  async staffNoShow(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { note?: string }) {
    await this.assertOwnSession(user, id);
    return this.svc.markNoShow(id, body?.note);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Patch('admin/slots/:slotId/mark-free')
  markSlotFree(@Param('slotId') slotId: string, @Body() body: { isFree: boolean }) {
    return this.svc.markSlotFree(slotId, body.isFree);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/applications')
  listApplications(@Query('status') status?: string) {
    return this.svc.listApplications(status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/applications/:id/review')
  @HttpCode(HttpStatus.OK)
  reviewApplication(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: ReviewApplicationDto,
  ) {
    const adminId = (req.user as any)?.sub ?? 'admin';
    return this.svc.reviewApplication(id, adminId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/payouts')
  listPayouts(@Query('status') status?: string) {
    return this.svc.listPayouts(status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/payouts/:id/mark-paid')
  markPayoutPaid(@Param('id') id: string, @Body() dto: MarkPayoutPaidDto) {
    return this.svc.markPayoutPaid(id, dto);
  }

  // ── Availability rules ──────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Get('admin/consultants/:id/availability')
  getAvailabilityRules(@Param('id') id: string) {
    return this.svc.getAvailabilityRules(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post('admin/consultants/:id/availability')
  createAvailabilityRule(@Param('id') id: string, @Body() dto: CreateAvailabilityRuleDto) {
    return this.svc.createAvailabilityRule(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Patch('admin/availability/:ruleId')
  updateAvailabilityRule(@Param('ruleId') ruleId: string, @Body() dto: CreateAvailabilityRuleDto) {
    return this.svc.updateAvailabilityRule(ruleId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Delete('admin/availability/:ruleId')
  @HttpCode(HttpStatus.OK)
  deleteAvailabilityRule(@Param('ruleId') ruleId: string) {
    return this.svc.deleteAvailabilityRule(ruleId);
  }

  // ── Blocked times ───────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Get('admin/consultants/:id/blocked')
  getBlockedTimes(@Param('id') id: string) {
    return this.svc.getBlockedTimes(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post('admin/consultants/:id/blocked')
  createBlockedTime(@Param('id') id: string, @Body() dto: CreateBlockedTimeDto) {
    return this.svc.createBlockedTime(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Delete('admin/blocked/:blockId')
  @HttpCode(HttpStatus.OK)
  deleteBlockedTime(@Param('blockId') blockId: string) {
    return this.svc.deleteBlockedTime(blockId);
  }

  // ── On-demand slot regeneration ─────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post('admin/consultants/:id/regenerate-slots')
  @HttpCode(HttpStatus.OK)
  regenerateSlots(@Param('id') id: string) {
    return this.svc.regenerateSlotsForConsultant(id);
  }
}
