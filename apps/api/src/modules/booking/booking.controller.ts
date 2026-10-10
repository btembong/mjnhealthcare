import { StaffOnly, CurrentUser, AuthUser } from '../auth/access';
import { AccessService } from '../auth/access.service';
import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingService } from './booking.service';

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
  ) {}

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

  @ApiOperation({ summary: 'Bulk create availability slots (admin / consultant)' })
  @ApiBearerAuth()
  @StaffOnly()
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
  @StaffOnly()
  @Delete('slots/:slotId')
  deleteSlot(@Param('slotId') slotId: string) {
    return this.bookingService.deleteSlot(slotId);
  }
}
