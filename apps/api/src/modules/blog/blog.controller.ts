import { AdminOnly } from '../auth/access';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('blog')
export class BlogController {
  constructor(private blog: BlogService) {}

  // Public
  @Get()
  getPublished() { return this.blog.getPublished(); }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) { return this.blog.getBySlug(slug); }

  // Admin
  @AdminOnly()
  @Get('admin/all')
  getAll() { return this.blog.getAll(); }

  @AdminOnly()
  @Get('admin/:id')
  getOne(@Param('id') id: string) { return this.blog.getOne(id); }

  @AdminOnly()
  @Post()
  create(@Body() dto: any) { return this.blog.create(dto); }

  @AdminOnly()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.blog.update(id, dto); }

  @AdminOnly()
  @Delete(':id')
  remove(@Param('id') id: string) { return this.blog.remove(id); }
}
