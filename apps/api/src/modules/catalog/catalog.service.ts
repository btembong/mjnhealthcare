import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';

@Injectable()
export class CatalogService {
  constructor(private readonly db: DatabaseService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  async getCategories() {
    return this.db.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: { variants: true },
        },
      },
    });
  }

  async getStandaloneItems() {
    return this.db.serviceItem.findMany({
      where: { isAvailableStandalone: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: { variants: true, category: { select: { id: true, name: true } } },
    });
  }

  async getItemById(id: string) {
    return this.db.serviceItem.findUnique({ where: { id }, include: { variants: true, category: true } });
  }

  async resolvePrice(itemId: string, variantKey?: string): Promise<number> {
    const item = await this.db.serviceItem.findUniqueOrThrow({
      where: { id: itemId },
      include: { variants: true },
    });
    if (variantKey) {
      const variant = item.variants.find((v) => v.variantKey === variantKey);
      if (variant) return Number(variant.priceUsd);
    }
    return Number(item.priceUsd);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async createCategory(data: { name: string; isMandatory?: boolean; sortOrder?: number }) {
    return this.db.serviceCategory.create({ data });
  }

  async createItem(data: {
    categoryId: string;
    name: string;
    priceUsd: number;
    description?: string;
    sortOrder?: number;
    variantGroup?: string;
    isDefaultSelected?: boolean;
    isAvailableStandalone?: boolean;
    variants?: { variantKey: string; priceUsd: number }[];
  }) {
    const { variants, ...itemData } = data;
    return this.db.serviceItem.create({
      data: {
        ...itemData,
        ...(variants?.length && {
          variants: { create: variants },
        }),
      },
      include: { variants: true, category: true },
    });
  }

  async updateItem(
    id: string,
    data: Partial<{
      name: string;
      priceUsd: number;
      description: string;
      sortOrder: number;
      isDefaultSelected: boolean;
      isAvailableStandalone: boolean;
    }>,
  ) {
    return this.db.serviceItem.update({ where: { id }, data, include: { variants: true } });
  }

  async createVariant(serviceItemId: string, variantKey: string, priceUsd: number) {
    return this.db.serviceItemVariant.create({ data: { serviceItemId, variantKey, priceUsd } });
  }

  async deleteItem(id: string) {
    return this.db.serviceItem.delete({ where: { id } });
  }

  async deleteCategory(id: string) {
    return this.db.serviceCategory.delete({ where: { id } });
  }
}
