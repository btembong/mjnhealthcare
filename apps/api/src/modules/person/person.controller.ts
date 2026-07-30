import { Controller, Get, Patch, Param, Body, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PersonService } from './person.service';

class UpdatePersonDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() profession?: string;
  @IsOptional() @IsEnum(['en', 'fr']) locale?: 'en' | 'fr';
}

@ApiTags('persons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('persons')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Get('me')
  getMe(@Request() req: any) {
    return this.personService.findById(req.user.id);
  }

  @Patch('me')
  updateMe(@Request() req: any, @Body() dto: UpdatePersonDto) {
    return this.personService.update(req.user.id, dto);
  }

  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'locale', required: false })
  @Get()
  findAll(@Query('role') role?: string, @Query('locale') locale?: string) {
    return this.personService.findAll({ role, locale });
  }

  // Staff management (ADMIN only)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('staff/list')
  findStaff() {
    return this.personService.findStaff();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.personService.updateRole(id, body.role);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/active')
  setActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.personService.setActive(id, body.isActive);
  }

  // System config (ADMIN only)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('system/config')
  getSystemConfig() {
    return this.personService.getSystemConfig();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('system/config')
  setSystemConfig(@Body() body: Record<string, string>) {
    return this.personService.setSystemConfig(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePersonDto) {
    return this.personService.update(id, dto);
  }
}
