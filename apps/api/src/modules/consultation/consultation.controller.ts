import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, Req, HttpCode, HttpStatus,
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
  constructor(private readonly svc: ConsultationService) {}

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

  @Get('client/:email')
  getClientBookings(@Param('email') email: string) {
    return this.svc.getClientBookings(email);
  }

  @Post('slots/:slotId/hold')
  @HttpCode(HttpStatus.OK)
  holdSlot(@Param('slotId') slotId: string, @Body() dto: HoldSlotDto) {
    return this.svc.holdSlot(slotId, dto.clientEmail);
  }

  // Tranzak webhook — no auth, verify via HMAC in service
  @Post('webhook/payment')
  @HttpCode(HttpStatus.OK)
  paymentWebhook(@Body() payload: any) {
    return this.svc.handlePaymentWebhook(payload);
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
  listSessions(@Query('consultantId') consultantId?: string, @Query('status') status?: string, @Req() req?: any) {
    // Consultants only see their own sessions
    const user = req?.user;
    const scopedConsultantId = user?.role?.toUpperCase() === 'CONSULTANT' ? user.sub : consultantId;
    return this.svc.listSessions(scopedConsultantId, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Get('admin/bookings/:id/join')
  getHostJoinInfo(@Param('id') id: string, @Req() req: any) {
    return this.svc.getHostJoinInfo(id, req.user?.name ?? req.user?.email ?? 'Consultant');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONSULTANT')
  @Post('admin/bookings/:id/complete')
  @HttpCode(HttpStatus.OK)
  markCompleted(@Param('id') id: string, @Body() body: { caseNote?: string }) {
    return this.svc.markCompleted(id, body?.caseNote);
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
