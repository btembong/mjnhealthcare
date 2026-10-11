import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';

/** Checkout always adds this item; it must exist and stay on offer. */
export const ENGAGEMENT_FEE_ITEM_ID = 'engagement-fee';
/**
 * The extra prices a service may carry. Checkout matches "nurse" / "physician" against the
 * client's profession, so these are fixed codes rather than free text.
 */
export const PRICE_TYPES = ['nurse', 'physician', 'retake'] as const;
const PROFESSION_TYPES = ['nurse', 'physician'];
const MAX_PRICE = 100000;

export type PriceInput = { key: string; priceUsd: number };
export type ItemInput = Partial<{
  name: string;
  description: string | null;
  priceUsd: number;
  categoryId: string;
  isDefaultSelected: boolean;
  isAvailableStandalone: boolean;
  isActive: boolean;
  prices: PriceInput[];
}>;

const byOrder = [{ sortOrder: 'asc' as const }, { id: 'asc' as const }];

function money(value: unknown, what = 'The price'): number {
  const n = typeof value === 'number' ? value : Number.NaN;
  if (!Number.isFinite(n) || n < 0) throw new BadRequestException(`${what} must be an amount of 0 or more.`);
  if (n > MAX_PRICE) throw new BadRequestException(`${what} looks too high. Check the amount.`);
  return Math.round(n * 100) / 100;
}

function cleanName(value: unknown, what: string): string {
  const name = String(value ?? '').trim();
  if (!name) throw new BadRequestException(`${what} needs a name.`);
  if (name.length > 160) throw new BadRequestException('That name is too long.');
  return name;
}

@Injectable()
export class CatalogService {
  constructor(private readonly db: DatabaseService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  /** What clients can choose from: hidden services and the categories left empty by them are left out. */
  async getCategories() {
    const categories = await this.db.serviceCategory.findMany({
      orderBy: byOrder,
      include: {
        items: {
          where: { isActive: true },
          orderBy: byOrder,
          include: { variants: true },
        },
      },
    });
    return categories.filter((c) => c.items.length > 0);
  }

  async getStandaloneItems() {
    return this.db.serviceItem.findMany({
      where: { isAvailableStandalone: true, isActive: true },
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

  /** A client's own cart may only contain services still on offer. */
  async assertOffered(itemIds: string[]) {
    if (itemIds.length === 0) return;
    const hidden = await this.db.serviceItem.findMany({
      where: { id: { in: itemIds }, isActive: false },
      select: { name: true },
    });
    if (hidden.length > 0) {
      throw new BadRequestException(`"${hidden[0].name}" is no longer offered. Remove it and try again.`);
    }
  }

  // ── Admin: reading ────────────────────────────────────────────────────────

  /** Everything, hidden services included, with where each one is used. */
  async getAdminCatalog() {
    const [categories, orderCounts, planCounts, stages] = await Promise.all([
      this.db.serviceCategory.findMany({
        orderBy: byOrder,
        include: {
          items: {
            orderBy: byOrder,
            include: { variants: { include: { _count: { select: { orderLineItems: true } } } } },
          },
        },
      }),
      this.db.orderLineItem.groupBy({ by: ['serviceItemId'], _count: { _all: true } }),
      this.db.engagementServicePlan.groupBy({ by: ['serviceItemId'], _count: { _all: true } }),
      this.db.licensingStage.findMany({
        where: { NOT: { serviceItemIds: { isEmpty: true } } },
        select: { label: true, serviceItemIds: true, pathway: { select: { country: true, regulatoryBody: true } } },
      }),
    ]);
    const orders = new Map(orderCounts.map((r: any) => [r.serviceItemId, r._count._all]));
    const plans = new Map(planCounts.map((r: any) => [r.serviceItemId, r._count._all]));

    return {
      priceTypes: PRICE_TYPES,
      categories: categories.map((c) => {
        const holdsFee = c.items.some((i) => i.id === ENGAGEMENT_FEE_ITEM_ID);
        return {
          id: c.id,
          name: c.name,
          isMandatory: c.isMandatory,
          locked: holdsFee,
          items: c.items.map((i: any) => {
            const stageUse = stages
              .filter((s) => s.serviceItemIds.includes(i.id))
              .map((s: any) => ({ stage: s.label, pathway: [s.pathway?.country, s.pathway?.regulatoryBody].filter(Boolean).join(' – ') }));
            const orderCount = orders.get(i.id) ?? 0;
            const planCount = plans.get(i.id) ?? 0;
            const locked = i.id === ENGAGEMENT_FEE_ITEM_ID;
            return {
              id: i.id,
              categoryId: i.categoryId,
              name: i.name,
              description: i.description ?? '',
              priceUsd: Number(i.priceUsd),
              isDefaultSelected: i.isDefaultSelected,
              isAvailableStandalone: i.isAvailableStandalone,
              isActive: i.isActive,
              locked,
              prices: i.variants
                .map((v: any) => ({ key: v.variantKey, priceUsd: Number(v.priceUsd), used: v._count.orderLineItems > 0 }))
                .sort((a: any, b: any) => a.key.localeCompare(b.key)),
              orderCount,
              planCount,
              stages: stageUse,
              canDelete: !locked && orderCount === 0 && planCount === 0 && stageUse.length === 0,
            };
          }),
        };
      }),
    };
  }

  /** Who changed this service's prices, newest first. */
  async getPriceHistory(itemId: string) {
    const rows = await this.db.auditLog.findMany({
      where: { resourceType: 'ServiceItem', resourceId: itemId, action: 'catalog.price_changed' },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    const actorIds = [...new Set(rows.map((r) => r.actorId))];
    const actors = actorIds.length
      ? await this.db.person.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })
      : [];
    const nameOf = new Map(actors.map((a) => [a.id, a.name]));
    return rows.map((r) => {
      const m = (r.metadata ?? {}) as Record<string, any>;
      return { at: r.createdAt, by: nameOf.get(r.actorId) ?? 'Staff', priceType: m.priceType ?? null, from: m.from ?? null, to: m.to ?? null };
    });
  }

  // ── Admin: categories ─────────────────────────────────────────────────────

  async createCategory(data: { name: string; isMandatory?: boolean }) {
    const last = await this.db.serviceCategory.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
    return this.db.serviceCategory.create({
      data: { name: cleanName(data?.name, 'A category'), isMandatory: data?.isMandatory === true, sortOrder: (last?.sortOrder ?? 0) + 1 },
    });
  }

  async updateCategory(id: string, data: { name?: string; isMandatory?: boolean }) {
    const category = await this.db.serviceCategory.findUnique({
      where: { id },
      include: { items: { where: { id: ENGAGEMENT_FEE_ITEM_ID }, select: { id: true } } },
    });
    if (!category) throw new NotFoundException('That category no longer exists.');
    if (category.items.length > 0 && data.isMandatory === false) {
      throw new BadRequestException('The engagement fee is always charged, so this category stays mandatory.');
    }
    return this.db.serviceCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: cleanName(data.name, 'A category') } : {}),
        ...(typeof data.isMandatory === 'boolean' ? { isMandatory: data.isMandatory } : {}),
      },
    });
  }

  async moveCategory(id: string, direction: 'up' | 'down') {
    const all = await this.db.serviceCategory.findMany({ orderBy: byOrder, select: { id: true } });
    await this.reorder(all.map((c) => c.id), id, direction, (rowId, sortOrder) =>
      this.db.serviceCategory.update({ where: { id: rowId }, data: { sortOrder } }));
    return { moved: true };
  }

  async deleteCategory(id: string) {
    const category = await this.db.serviceCategory.findUnique({ where: { id }, include: { _count: { select: { items: true } } } });
    if (!category) throw new NotFoundException('That category no longer exists.');
    if ((category as any)._count.items > 0) {
      throw new BadRequestException('This category still has services in it. Move or delete them first.');
    }
    await this.db.serviceCategory.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Admin: services ───────────────────────────────────────────────────────

  async createItem(actorId: string, data: ItemInput & { categoryId: string; name: string; priceUsd: number }) {
    const category = await this.db.serviceCategory.findUnique({ where: { id: data?.categoryId ?? '' }, select: { id: true } });
    if (!category) throw new BadRequestException('Choose a category.');
    const prices = this.cleanPrices(data.prices ?? [], []);
    const last = await this.db.serviceItem.findFirst({ where: { categoryId: category.id }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
    const item = await this.db.serviceItem.create({
      data: {
        categoryId: category.id,
        name: cleanName(data.name, 'A service'),
        description: String(data.description ?? '').trim() || null,
        priceUsd: money(data.priceUsd),
        sortOrder: (last?.sortOrder ?? 0) + 1,
        isDefaultSelected: data.isDefaultSelected !== false,
        isAvailableStandalone: data.isAvailableStandalone === true,
        variantGroup: prices.some((p) => PROFESSION_TYPES.includes(p.key)) ? 'profession' : null,
        variants: { create: prices.map((p) => ({ variantKey: p.key, priceUsd: p.priceUsd })) },
      },
    });
    await this.logPrice(actorId, item.id, null, null, Number(item.priceUsd));
    return { id: item.id };
  }

  async updateItem(actorId: string, id: string, data: ItemInput) {
    const item = await this.db.serviceItem.findUnique({
      where: { id },
      include: { variants: { include: { _count: { select: { orderLineItems: true } } } } },
    });
    if (!item) throw new NotFoundException('That service no longer exists.');
    const locked = id === ENGAGEMENT_FEE_ITEM_ID;
    if (locked && data.isActive === false) throw new BadRequestException('The engagement fee is added to every first order, so it cannot be hidden.');
    if (locked && data.categoryId && data.categoryId !== item.categoryId) throw new BadRequestException('The engagement fee stays in its own category.');
    if (locked && data.prices && data.prices.length > 0) throw new BadRequestException('The engagement fee has one price for everyone.');

    const update: Record<string, unknown> = {};
    const history: { priceType: string | null; from: number | null; to: number | null }[] = [];
    const ops: any[] = [];

    if (data.name !== undefined) update.name = cleanName(data.name, 'A service');
    if (data.description !== undefined) update.description = String(data.description ?? '').trim() || null;
    if (typeof data.isDefaultSelected === 'boolean') update.isDefaultSelected = data.isDefaultSelected;
    if (typeof data.isAvailableStandalone === 'boolean') update.isAvailableStandalone = data.isAvailableStandalone;
    if (typeof data.isActive === 'boolean') update.isActive = data.isActive;
    if (data.priceUsd !== undefined) {
      const price = money(data.priceUsd);
      if (price !== Number(item.priceUsd)) {
        update.priceUsd = price;
        history.push({ priceType: null, from: Number(item.priceUsd), to: price });
      }
    }
    if (data.categoryId && data.categoryId !== item.categoryId) {
      const category = await this.db.serviceCategory.findUnique({ where: { id: data.categoryId }, select: { id: true } });
      if (!category) throw new BadRequestException('Choose a category.');
      const last = await this.db.serviceItem.findFirst({ where: { categoryId: category.id }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
      update.categoryId = category.id;
      update.sortOrder = (last?.sortOrder ?? 0) + 1;
    }

    if (data.prices !== undefined) {
      const wanted = this.cleanPrices(data.prices, item.variants.map((v) => v.variantKey));
      for (const p of wanted) {
        const existing = item.variants.find((v) => v.variantKey === p.key);
        if (!existing) {
          ops.push(this.db.serviceItemVariant.create({ data: { serviceItemId: id, variantKey: p.key, priceUsd: p.priceUsd } }));
          history.push({ priceType: p.key, from: null, to: p.priceUsd });
        } else if (Number(existing.priceUsd) !== p.priceUsd) {
          ops.push(this.db.serviceItemVariant.update({ where: { id: existing.id }, data: { priceUsd: p.priceUsd } }));
          history.push({ priceType: p.key, from: Number(existing.priceUsd), to: p.priceUsd });
        }
      }
      for (const v of item.variants as any[]) {
        if (wanted.some((p) => p.key === v.variantKey)) continue;
        if (v._count.orderLineItems > 0) {
          throw new BadRequestException(`The "${v.variantKey}" price has been used on orders, so it cannot be removed. Change its amount instead.`);
        }
        ops.push(this.db.serviceItemVariant.delete({ where: { id: v.id } }));
        history.push({ priceType: v.variantKey, from: Number(v.priceUsd), to: null });
      }
      update.variantGroup = wanted.some((p) => PROFESSION_TYPES.includes(p.key)) ? 'profession' : null;
    }

    await this.db.$transaction([
      ...ops,
      this.db.serviceItem.update({ where: { id }, data: update }),
      ...history.map((h) => this.db.auditLog.create({
        data: { actorId, action: 'catalog.price_changed', resourceType: 'ServiceItem', resourceId: id, metadata: h as any },
      })),
    ]);
    return { id, priceChanges: history.length };
  }

  async moveItem(id: string, direction: 'up' | 'down') {
    const item = await this.db.serviceItem.findUnique({ where: { id }, select: { categoryId: true } });
    if (!item) throw new NotFoundException('That service no longer exists.');
    const siblings = await this.db.serviceItem.findMany({ where: { categoryId: item.categoryId }, orderBy: byOrder, select: { id: true } });
    await this.reorder(siblings.map((s) => s.id), id, direction, (rowId, sortOrder) =>
      this.db.serviceItem.update({ where: { id: rowId }, data: { sortOrder } }));
    return { moved: true };
  }

  /** Only a service nobody has ever ordered, planned or tied to a stage can be deleted. Others are hidden. */
  async deleteItem(id: string) {
    if (id === ENGAGEMENT_FEE_ITEM_ID) throw new BadRequestException('The engagement fee is needed by checkout and cannot be deleted.');
    const item = await this.db.serviceItem.findUnique({ where: { id }, select: { id: true } });
    if (!item) throw new NotFoundException('That service no longer exists.');
    const [orders, plans, stages] = await Promise.all([
      this.db.orderLineItem.count({ where: { serviceItemId: id } }),
      this.db.engagementServicePlan.count({ where: { serviceItemId: id } }),
      this.db.licensingStage.count({ where: { serviceItemIds: { has: id } } }),
    ]);
    if (orders + plans + stages > 0) {
      throw new BadRequestException('This service is on orders or needed by a pathway stage, so it cannot be deleted. Hide it instead.');
    }
    await this.db.$transaction([
      this.db.serviceItemVariant.deleteMany({ where: { serviceItemId: id } }),
      this.db.serviceItem.delete({ where: { id } }),
    ]);
    return { deleted: true };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Extra prices must use a known code (or one this service already has) and appear once each. */
  private cleanPrices(prices: PriceInput[], alreadyOnItem: string[]): PriceInput[] {
    if (!Array.isArray(prices)) throw new BadRequestException('The prices could not be read.');
    const seen = new Set<string>();
    return prices.map((p) => {
      const key = String(p?.key ?? '').trim();
      const known = (PRICE_TYPES as readonly string[]).includes(key) || alreadyOnItem.includes(key);
      if (!known) throw new BadRequestException(`"${key}" is not a price type.`);
      if (seen.has(key)) throw new BadRequestException(`The "${key}" price appears twice.`);
      seen.add(key);
      return { key, priceUsd: money(p.priceUsd, `The ${key} price`) };
    });
  }

  /** Swaps a row with its neighbour and renumbers the whole list, so ties in the old numbering cannot linger. */
  private async reorder(ids: string[], id: string, direction: 'up' | 'down', save: (id: string, sortOrder: number) => any) {
    const at = ids.indexOf(id);
    if (at < 0) throw new NotFoundException('That no longer exists.');
    const to = direction === 'up' ? at - 1 : at + 1;
    if (to < 0 || to >= ids.length) return;
    [ids[at], ids[to]] = [ids[to], ids[at]];
    await this.db.$transaction(ids.map((rowId, index) => save(rowId, index + 1)));
  }

  private logPrice(actorId: string, itemId: string, priceType: string | null, from: number | null, to: number | null) {
    return this.db.auditLog.create({
      data: { actorId, action: 'catalog.price_changed', resourceType: 'ServiceItem', resourceId: itemId, metadata: { priceType, from, to } },
    });
  }
}
