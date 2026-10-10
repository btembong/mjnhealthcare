import { Controller, Get, Patch, Post, Param, Body, UseGuards, Query, Request, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PersonService } from './person.service';
import { STAFF_ROLES, isAdmin, CurrentUser, AuthUser } from '../auth/access';
import { AccessService } from '../auth/access.service';

class UpdatePersonDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() profession?: string;
  @IsOptional() @IsEnum(['en', 'fr']) locale?: 'en' | 'fr';
}

@ApiTags('persons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('persons')
export class PersonController {
  constructor(
    private readonly personService: PersonService,
    private readonly access: AccessService,
  ) {}

  @Get('me')
  getMe(@Request() req: any) {
    return this.personService.findById(req.user.id);
  }

  @Patch('me')
  updateMe(@Request() req: any, @Body() dto: UpdatePersonDto) {
    return this.personService.update(req.user.id, dto);
  }

  @Post('me/tours/:key')
  completeTour(@Request() req: any, @Param('key') key: string) {
    if (!/^[a-z0-9._-]{1,64}$/.test(key)) throw new BadRequestException('Invalid tour key.');
    return this.personService.completeTour(req.user.id, key);
  }

  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'locale', required: false })
  @Roles(...STAFF_ROLES)
  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('role') role?: string,
    @Query('locale') locale?: string,
  ) {
    const persons = await this.personService.findAll({ role, locale });
    const scope = await this.access.consultantScope(user);
    return scope ? persons.filter((p: any) => scope.canSeePerson(p.id)) : persons;
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

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/credentials')
  async updateCredentials(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; password?: string },
  ) {
    if (!body.name && !body.email && !body.password) {
      throw new BadRequestException('Provide at least one field to update.');
    }
    const data: { name?: string; email?: string; passwordHash?: string } = {};
    if (body.name) data.name = body.name;
    if (body.email) data.email = body.email;
    if (body.password) {
      if (body.password.length < 8) throw new BadRequestException('Password must be at least 8 characters.');
      data.passwordHash = await bcrypt.hash(body.password, 10);
    }
    return this.personService.updateCredentials(id, data);
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
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.access.assertPerson(user, id);
    return this.personService.findById(id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdatePersonDto) {
    if (req.user.id !== id && !isAdmin(req.user)) {
      throw new ForbiddenException('You can only edit your own profile.');
    }
    return this.personService.update(id, dto);
  }
}
