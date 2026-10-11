import { AdminOnly, CurrentUser, AuthUser } from '../auth/access';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsIn, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CatalogService } from './catalog.service';

class PriceDto {
  @IsString() key!: string;
  @IsNumber() @Min(0) priceUsd!: number;
}

class CreateCategoryDto {
  @IsString() name!: string;
  @IsOptional() @IsBoolean() isMandatory?: boolean;
}

class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsBoolean() isMandatory?: boolean;
}

class MoveDto {
  @IsIn(['up', 'down']) direction!: 'up' | 'down';
}

class CreateItemDto {
  @IsString() categoryId!: string;
  @IsString() name!: string;
  @IsNumber() @Min(0) priceUsd!: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isDefaultSelected?: boolean;
  @IsOptional() @IsBoolean() isAvailableStandalone?: boolean;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PriceDto) prices?: PriceDto[];
}

class UpdateItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() @Min(0) priceUsd?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsBoolean() isDefaultSelected?: boolean;
  @IsOptional() @IsBoolean() isAvailableStandalone?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PriceDto) prices?: PriceDto[];
}

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ── Public endpoints ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Service categories with the services on offer (hidden ones left out)' })
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

  @ApiOperation({ summary: 'The whole catalog, hidden services included, with where each is used (admin)' })
  @ApiBearerAuth()
  @AdminOnly()
  @Get('admin')
  getAdminCatalog() {
    return this.catalogService.getAdminCatalog();
  }

  @ApiOperation({ summary: "A service's price changes (admin)" })
  @ApiBearerAuth()
  @AdminOnly()
  @Get('items/:id/history')
  getPriceHistory(@Param('id') id: string) {
    return this.catalogService.getPriceHistory(id);
  }

  @ApiOperation({ summary: 'Create a service category (admin)' })
  @ApiBearerAuth()
  @AdminOnly()
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @ApiOperation({ summary: 'Rename a category or change whether it is always charged (admin)' })
  @ApiBearerAuth()
  @AdminOnly()
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalogService.updateCategory(id, dto);
  }

  @ApiOperation({ summary: 'Move a category up or down (admin)' })
  @ApiBearerAuth()
  @AdminOnly()
  @Post('categories/:id/move')
  @HttpCode(200)
  moveCategory(@Param('id') id: string, @Body() dto: MoveDto) {
    return this.catalogService.moveCategory(id, dto.direction);
  }

  @ApiOperation({ summary: 'Delete an empty category (admin)' })
  @ApiBearerAuth()
  @AdminOnly()
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(id);
  }

  @ApiOperation({ summary: 'Create a service, optionally with extra prices (admin)' })
  @ApiBearerAuth()
  @AdminOnly()
  @Post('items')
  createItem(@CurrentUser() user: AuthUser, @Body() dto: CreateItemDto) {
    return this.catalogService.createItem(user.id, dto);
  }

  @ApiOperation({ summary: 'Update a service: details, prices, whether it is offered (admin)' })
  @ApiBearerAuth()
  @AdminOnly()
  @Patch('items/:id')
  updateItem(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateItemDto) {
    if (!dto || Object.keys(dto).length === 0) throw new BadRequestException('Nothing to change.');
    return this.catalogService.updateItem(user.id, id, dto);
  }

  @ApiOperation({ summary: 'Move a service up or down within its category (admin)' })
  @ApiBearerAuth()
  @AdminOnly()
  @Post('items/:id/move')
  @HttpCode(200)
  moveItem(@Param('id') id: string, @Body() dto: MoveDto) {
    return this.catalogService.moveItem(id, dto.direction);
  }

  @ApiOperation({ summary: 'Delete a service that has never been used (admin)' })
  @ApiBearerAuth()
  @AdminOnly()
  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.catalogService.deleteItem(id);
  }
}
