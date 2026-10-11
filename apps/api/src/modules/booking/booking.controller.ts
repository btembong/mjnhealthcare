import { StaffOnly, AdminOnly, RolesOnly, CurrentUser, AuthUser } from '../auth/access';
import { AccessService } from '../auth/access.service';
import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingService } from './booking.service';
import { FreeConsultService, SlotPlanInput } from './free-consult.service';

/** Free consultations are run by admins (everyone's) and consultants (their own). */
const FreeConsultStaff = () => RolesOnly('ADMIN', 'CONSULTANT');

class SlotInputDto {
  @IsString() date!: string;
  @IsString() startTime!: string;
  @IsString() endTime!: string;
}

class CreateSlotsDto {
  @IsString() resourceId!: string;
  @IsString() consultantId?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SlotInputDto) slots!: SlotInputDto[];
}

class CreateBookingDto {
  @IsString() personId!: string;
  @IsString() slotId!: string;
  @IsString() type!: string;
}

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly access: AccessService,
    private readonly freeConsult: FreeConsultService,
  ) {}

  // ── Free consultations (admin console) ──────────────────────────────────────

  @ApiOperation({ summary: 'Free-consultation bookings and open times the caller may manage' })
  @ApiBearerAuth()
  @FreeConsultStaff()
  @Get('free-consult/overview')
  freeConsultOverview(@CurrentUser() user: AuthUser) {
    return this.freeConsult.overview(user);
  }

  @ApiOperation({ summary: "One consultant's free times for a week (Douala calendar)" })
  @ApiBearerAuth()
  @FreeConsultStaff()
  @Get('free-consult/week')
  freeConsultWeek(@CurrentUser() user: AuthUser, @Query('consultantId') consultantId: string, @Query('from') from: string) {
    return this.freeConsult.week(user, consultantId, from);
  }

  @ApiOperation({ summary: 'Check which free times would be added, without saving' })
  @ApiBearerAuth()
  @FreeConsultStaff()
  @Post('free-consult/slots/preview')
  @HttpCode(200)
  previewFreeConsultSlots(@CurrentUser() user: AuthUser, @Body() body: SlotPlanInput) {
    return this.freeConsult.previewSlots(user, body);
  }

  @ApiOperation({ summary: 'Add free times (Douala clock times; duplicates and clashes are skipped)' })
  @ApiBearerAuth()
  @FreeConsultStaff()
  @Post('free-consult/slots')
  createFreeConsultSlots(@CurrentUser() user: AuthUser, @Body() body: SlotPlanInput) {
    return this.freeConsult.createSlots(user, body);
  }

  @ApiOperation({ summary: 'Remove an open free time' })
  @ApiBearerAuth()
  @FreeConsultStaff()
  @Delete('free-consult/slots/:slotId')
  removeFreeConsultSlot(@CurrentUser() user: AuthUser, @Param('slotId') slotId: string) {
    return this.freeConsult.removeSlot(user, slotId);
  }

  @ApiOperation({ summary: 'Host entry to a free consultation' })
  @ApiBearerAuth()
  @FreeConsultStaff()
  @Get('free-consult/:id/join')
  freeConsultJoin(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.freeConsult.hostJoin(user, id);
  }

  @ApiOperation({ summary: 'Record whether the person attended' })
  @ApiBearerAuth()
  @FreeConsultStaff()
  @Post('free-consult/:id/outcome')
  @HttpCode(200)
  freeConsultOutcome(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { attended: boolean }) {
    return this.freeConsult.setOutcome(user, id, body?.attended === true);
  }

  @ApiOperation({ summary: 'Cancel a free consultation and tell the person' })
  @ApiBearerAuth()
  @FreeConsultStaff()
  @Post('free-consult/:id/cancel')
  @HttpCode(200)
  freeConsultCancel(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { reason: string; reopen?: boolean }) {
    return this.freeConsult.cancel(user, id, String(body?.reason ?? ''), body?.reopen !== false);
  }

  @ApiOperation({ summary: 'Move a free consultation to another open time and tell the person' })
  @ApiBearerAuth()
  @FreeConsultStaff()
  @Post('free-consult/:id/move')
  @HttpCode(200)
  freeConsultMove(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { slotId: string }) {
    return this.freeConsult.move(user, id, String(body?.slotId ?? ''));
  }

  @ApiOperation({ summary: 'List consultants with free-consultation availability (public)' })
  @Get('general-consultation/consultants')
  getGeneralConsultationConsultants() {
    return this.bookingService.getGeneralConsultationConsultants();
  }

  @ApiOperation({ summary: 'List available slots for a resource on a date (public)' })
  @ApiQuery({ name: 'date', required: true, example: '2026-08-01' })
  @ApiQuery({ name: 'consultantId', required: false })
  @Get('slots/:resourceId')
  getSlots(
    @Param('resourceId') resourceId: string,
    @Query('date') date: string,
    @Query('consultantId') consultantId?: string,
  ) {
    return this.bookingService.getAvailableSlots(resourceId, date, consultantId);
  }

  @ApiOperation({ summary: 'Bulk create availability slots, unchecked (admin). Free consultations use free-consult/slots.' })
  @ApiBearerAuth()
  @AdminOnly()
  @Post('slots')
  createSlots(@Body() dto: CreateSlotsDto) {
    return this.bookingService.createSlots(dto);
  }

  @ApiOperation({ summary: 'Book a slot (authenticated candidate)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    await this.access.assertPerson(user, dto.personId);
    return this.bookingService.createBooking(dto.personId, dto.slotId, dto.type);
  }

  @ApiOperation({ summary: 'Get all bookings (admin)' })
  @ApiBearerAuth()
  @StaffOnly()
  @Get('admin')
  findAll() {
    return this.bookingService.getAllBookings();
  }

  @ApiOperation({ summary: "Get a person's bookings" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('person/:personId')
  async getByPerson(@CurrentUser() user: AuthUser, @Param('personId') personId: string) {
    await this.access.assertPerson(user, personId);
    return this.bookingService.getBookingsByPerson(personId);
  }

  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.assertBooking(user, id);
    return this.bookingService.cancelBooking(id);
  }

  @ApiOperation({ summary: 'Get all general-consultation slots (admin)' })
  @ApiBearerAuth()
  @StaffOnly()
  @Get('admin/general-consultation')
  getGeneralConsultationSlots() {
    return this.bookingService.getGeneralConsultationSlots();
  }

  @ApiOperation({ summary: 'Delete an availability slot (admin)' })
  @ApiBearerAuth()
  @AdminOnly()
  @Delete('slots/:slotId')
  deleteSlot(@Param('slotId') slotId: string) {
    return this.bookingService.deleteSlot(slotId);
  }
}
