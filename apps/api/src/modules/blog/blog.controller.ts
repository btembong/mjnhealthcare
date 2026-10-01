import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('blog')
export class BlogController {
  constructor(private blog: BlogService) {}

  // Public
  @Get()
  getPublished() { return this.blog.getPublished(); }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) { return this.blog.getBySlug(slug); }

  // Admin
  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  getAll() { return this.blog.getAll(); }

  @UseGuards(JwtAuthGuard)
  @Get('admin/:id')
  getOne(@Param('id') id: string) { return this.blog.getOne(id); }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: any) { return this.blog.create(dto); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.blog.update(id, dto); }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.blog.remove(id); }
}
