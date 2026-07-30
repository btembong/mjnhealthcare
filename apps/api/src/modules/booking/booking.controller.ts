import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
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
  constructor(private readonly bookingService: BookingService) {}

  @ApiOperation({ summary: 'List available slots for a resource on a date (public)' })
  @ApiQuery({ name: 'date', required: true, example: '2026-08-01' })
  @Get('slots/:resourceId')
  getSlots(@Param('resourceId') resourceId: string, @Query('date') date: string) {
    return this.bookingService.getAvailableSlots(resourceId, date);
  }

  @ApiOperation({ summary: 'Bulk create availability slots (admin / consultant)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('slots')
  createSlots(@Body() dto: CreateSlotsDto) {
    return this.bookingService.createSlots(dto);
  }

  @ApiOperation({ summary: 'Book a slot (authenticated candidate)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(dto.personId, dto.slotId, dto.type);
  }

  @ApiOperation({ summary: 'Get all bookings (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin')
  findAll() {
    return this.bookingService.getAllBookings();
  }

  @ApiOperation({ summary: "Get a person's bookings" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('person/:personId')
  getByPerson(@Param('personId') personId: string) {
    return this.bookingService.getBookingsByPerson(personId);
  }

  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.bookingService.cancelBooking(id);
  }
}
