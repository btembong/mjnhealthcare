import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CatalogService } from './catalog.service';

class VariantDto {
  @IsString() variantKey!: string;
  @IsNumber() @Min(0) priceUsd!: number;
}

class CreateCategoryDto {
  @IsString() name!: string;
  @IsOptional() @IsBoolean() isMandatory?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
}

class CreateItemDto {
  @IsString() categoryId!: string;
  @IsString() name!: string;
  @IsNumber() @Min(0) priceUsd!: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsString() variantGroup?: string;
  @IsOptional() @IsBoolean() isDefaultSelected?: boolean;
  @IsOptional() @IsBoolean() isAvailableStandalone?: boolean;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VariantDto) variants?: VariantDto[];
}

class UpdateItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() @Min(0) priceUsd?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsBoolean() isDefaultSelected?: boolean;
  @IsOptional() @IsBoolean() isAvailableStandalone?: boolean;
}

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ── Public endpoints ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get all service categories with items (pipeline catalog)' })
  @Get('categories')
  getCategories(): Promise<any> {
    return this.catalogService.getCategories();
  }

  @ApiOperation({ summary: 'Get standalone-purchasable items (à la carte catalog — public)' })
  @Get('standalone')
  getStandaloneItems(): Promise<any> {
    return this.catalogService.getStandaloneItems();
  }

  @ApiOperation({ summary: 'Get a single service item' })
  @Get('items/:id')
  getItem(@Param('id') id: string): Promise<any> {
    return this.catalogService.getItemById(id);
  }

  @ApiOperation({ summary: 'Resolve price for an item, optionally with a variant' })
  @Get('items/:id/price')
  resolvePrice(@Param('id') id: string, @Query('variant') variant?: string) {
    return this.catalogService.resolvePrice(id, variant);
  }

  // ── Admin endpoints ───────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a service category (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @ApiOperation({ summary: 'Create a service item with optional variants (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('items')
  createItem(@Body() dto: CreateItemDto) {
    return this.catalogService.createItem(dto);
  }

  @ApiOperation({ summary: 'Update a service item (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.catalogService.updateItem(id, dto);
  }

  @ApiOperation({ summary: 'Add a variant to an existing item (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('items/:id/variants')
  createVariant(@Param('id') id: string, @Body() dto: VariantDto) {
    return this.catalogService.createVariant(id, dto.variantKey, dto.priceUsd);
  }

  @ApiOperation({ summary: 'Delete a service item (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.catalogService.deleteItem(id);
  }

  @ApiOperation({ summary: 'Delete a service category (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(id);
  }
}
