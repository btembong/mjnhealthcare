import { BadRequestException, Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, Length, MinLength, ValidateIf } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

class RequestOtpDto {
  @ValidateIf((o) => !o.phone)
  @IsEmail()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsEnum(['email', 'phone'])
  via?: 'email' | 'phone';
}

class VerifyOtpDto {
  @ValidateIf((o) => !o.phone)
  @IsEmail()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsPhoneNumber()
  phone?: string;

  @IsString()
  @Length(6, 6)
  otp!: string;

  @IsOptional()
  @IsEnum(['email', 'phone'])
  via?: 'email' | 'phone';
}

class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

class RegisterStaffDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(['CONSULTANT', 'ADMIN', 'PARTNER'])
  role!: 'CONSULTANT' | 'ADMIN' | 'PARTNER';
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Staff / partner login (email + password)' })
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @Post('login/staff')
  loginStaff(@Request() req: any) {
    return this.authService.loginStaff(req.user);
  }

  @ApiOperation({ summary: 'Register a staff / consultant / partner account (admin only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('register/staff')
  registerStaff(@Body() dto: RegisterStaffDto) {
    return this.authService.registerStaff(dto);
  }

  @ApiOperation({ summary: 'Request OTP — send via email (default) or phone' })
  @HttpCode(HttpStatus.OK)
  @Post('otp/request')
  async requestOtp(@Body() dto: RequestOtpDto) {
    const identifier = dto.email ?? dto.phone;
    if (!identifier) throw new BadRequestException('Provide email or phone');
    const via = dto.via ?? (dto.email ? 'email' : 'phone');
    await this.authService.sendOtp(identifier, via);
    return { message: 'OTP sent' };
  }

  @ApiOperation({ summary: 'Verify OTP and receive JWT' })
  @HttpCode(HttpStatus.OK)
  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    const identifier = dto.email ?? dto.phone;
    if (!identifier) throw new BadRequestException('Provide email or phone');
    const via = dto.via ?? (dto.email ? 'email' : 'phone');
    return this.authService.verifyOtp(identifier, dto.otp, via);
  }

  @ApiOperation({ summary: 'Change own password (staff)' })
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(@Request() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }

  @ApiOperation({ summary: 'Request a password reset link (staff)' })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  @ApiOperation({ summary: 'Reset password using token from email link' })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
