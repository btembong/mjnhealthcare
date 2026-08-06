import {
  IsString, IsEmail, IsEnum, IsBoolean, IsOptional,
  IsInt, Min, Max, IsArray, IsUrl, IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ConsultationCategoryDto {
  HEALTH = 'HEALTH',
  CAREER = 'CAREER',
  BOTH = 'BOTH',
}

export class BookConsultationDto {
  @IsString() slotId!: string;
  @IsString() clientName!: string;
  @IsEmail() clientEmail!: string;
  @IsString() clientPhone!: string;
  @IsEnum(ConsultationCategoryDto) consultationCategory!: ConsultationCategoryDto;
  @IsBoolean() recordingConsent!: boolean;
  @IsOptional() @IsString() preSessionNote?: string;
  @IsOptional() @IsUrl() returnUrl?: string;
}

export class CancelConsultationDto {
  @IsString() bookingId!: string;
  @IsEmail() clientEmail!: string;
}

export class CreateSlotDto {
  @IsString() consultantId!: string;
  @IsString() startAt!: string;
  @IsOptional() @IsInt() @Min(15) @Max(120) durationMinutes?: number;
}

export class CreateSlotsDto {
  @IsArray() slots!: CreateSlotDto[];
}

export class CreateConsultantDto {
  @IsString() name!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() bio!: string;
  @IsOptional() @IsString() @IsUrl() photoUrl?: string;
  @IsString() specialty!: string;
  @IsArray() @IsString({ each: true }) languages!: string[];
  @IsEnum(['STAFF', 'PARTNER']) type!: 'STAFF' | 'PARTNER';
  @IsEnum(['HEALTH', 'CAREER', 'BOTH']) consultationCategory!: string;
  @IsOptional() @IsString() licenseNumber?: string;
  @IsOptional() @IsString() licenseBody?: string;
  @IsNumber() @Type(() => Number) priceUsd!: number;
  @IsOptional() @IsInt() @Min(15) @Max(120) sessionDurationMins?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) @Type(() => Number) commissionRate?: number;
}

export class UpdateConsultantDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() @IsUrl() photoUrl?: string;
  @IsOptional() @IsEnum(['HEALTH', 'CAREER', 'BOTH']) consultationCategory?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
  @IsOptional() @IsNumber() @Type(() => Number) priceUsd?: number;
  @IsOptional() @IsInt() @Min(15) @Max(120) sessionDurationMins?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) @Type(() => Number) commissionRate?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsEnum(['ACTIVE', 'SUSPENDED']) status?: string;
}

export class SubmitApplicationDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsString() phone!: string;
  @IsEnum(['HEALTH', 'CAREER', 'BOTH']) consultationCategory!: string;
  @IsString() specialty!: string;
  @IsOptional() @IsString() licenseNumber?: string;
  @IsOptional() @IsString() licenseBody?: string;
  @IsString() bio!: string;
  @IsArray() @IsString({ each: true }) languages!: string[];
  @IsInt() @Min(0) @Type(() => Number) yearsExperience!: number;
  @IsOptional() @IsArray() @IsString({ each: true }) documentUrls?: string[];
}

export class ReviewApplicationDto {
  @IsEnum(['APPROVED', 'REJECTED']) decision!: 'APPROVED' | 'REJECTED';
  @IsOptional() @IsString() reviewNote?: string;
}

export class MarkPayoutPaidDto {
  @IsOptional() @IsString() paymentRef?: string;
}
