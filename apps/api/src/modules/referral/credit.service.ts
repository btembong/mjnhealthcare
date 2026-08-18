import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';

const MAX_SPEND_PCT = 30; // max % of subtotal payable by credits

@Injectable()
export class CreditService {
  constructor(private readonly db: DatabaseService) {}

  // ── Wallet ─────────────────────────────────────────────────────────────────

  async getOrCreateWallet(personId: string) {
    const existing = await this.db.creditWallet.findUnique({ where: { personId } });
    if (existing) return existing;
    return this.db.creditWallet.create({ data: { personId } });
  }

  async getWallet(personId: string) {
    const wallet = await this.db.creditWallet.findUnique({
      where: { personId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!wallet) return this.getOrCreateWallet(personId).then((w) => ({ ...w, transactions: [] }));
    return wallet;
  }

  // ── Add credits ────────────────────────────────────────────────────────────

  async addCredits(
    personId: string,
    amountCents: number,
    type: 'EARNED' | 'ADJUSTED' | 'TRANSFERRED_IN',
    reason: string,
    referenceId?: string,
  ) {
    const wallet = await this.getOrCreateWallet(personId);
    const newBalance = wallet.balanceCents + amountCents;
    const expiresAt = type === 'EARNED'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 12 months
      : undefined;

    await this.db.$transaction([
      this.db.creditWallet.update({
        where: { id: wallet.id },
        data: {
          balanceCents: newBalance,
          lifetimeEarnedCents: type === 'EARNED' ? { increment: amountCents } : undefined,
        },
      }),
      this.db.creditTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amountCents,
          balanceAfterCents: newBalance,
          reason,
          referenceId,
          expiresAt,
        },
      }),
    ]);

    return newBalance;
  }

  // ── Spend credits ──────────────────────────────────────────────────────────

  async spendCredits(
    personId: string,
    requestedCents: number,
    subtotalCents: number,
    orderId: string,
  ): Promise<number> {
    const wallet = await this.getOrCreateWallet(personId);
    if (wallet.balanceCents <= 0) return 0;

    const maxAllowed = Math.floor(subtotalCents * MAX_SPEND_PCT / 100);
    const toSpend = Math.min(requestedCents, wallet.balanceCents, maxAllowed);
    if (toSpend <= 0) return 0;

    const newBalance = wallet.balanceCents - toSpend;

    await this.db.$transaction([
      this.db.creditWallet.update({
        where: { id: wallet.id },
        data: {
          balanceCents: newBalance,
          lifetimeSpentCents: { increment: toSpend },
        },
      }),
      this.db.creditTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'SPENT',
          amountCents: -toSpend,
          balanceAfterCents: newBalance,
          reason: `Applied to order #${orderId.slice(0, 8).toUpperCase()}`,
          referenceId: orderId,
        },
      }),
    ]);

    return toSpend;
  }

  // ── Transfer credits ────────────────────────────────────────────────────────

  async transferCredits(
    fromPersonId: string,
    toPersonId: string,
    amountCents: number,
    note: string | undefined,
    initiatedById: string,
  ) {
    if (amountCents < 500) throw new BadRequestException('Minimum transfer is $5 (500 cents)');
    if (fromPersonId === toPersonId) throw new BadRequestException('Cannot transfer to yourself');

    const fromWallet = await this.getOrCreateWallet(fromPersonId);
    if (fromWallet.balanceCents < amountCents) throw new BadRequestException('Insufficient credits');

    const toWallet = await this.getOrCreateWallet(toPersonId);

    const fromNew = fromWallet.balanceCents - amountCents;
    const toNew = toWallet.balanceCents + amountCents;

    const transfer = await this.db.$transaction(async (tx: any) => {
      const t = await tx.creditTransfer.create({
        data: { fromWalletId: fromWallet.id, toWalletId: toWallet.id, amountCents, note, initiatedById },
      });
      await tx.creditWallet.update({ where: { id: fromWallet.id }, data: { balanceCents: fromNew } });
      await tx.creditWallet.update({ where: { id: toWallet.id }, data: { balanceCents: toNew, lifetimeEarnedCents: { increment: amountCents } } });
      await tx.creditTransaction.create({
        data: { walletId: fromWallet.id, type: 'TRANSFERRED_OUT', amountCents: -amountCents, balanceAfterCents: fromNew, reason: note ?? 'Credit transfer', referenceId: t.id },
      });
      await tx.creditTransaction.create({
        data: { walletId: toWallet.id, type: 'TRANSFERRED_IN', amountCents, balanceAfterCents: toNew, reason: note ?? 'Credit received', referenceId: t.id },
      });
      return t;
    });

    return transfer;
  }

  // ── Preview spend at checkout ───────────────────────────────────────────────

  async previewSpend(personId: string, subtotalCents: number) {
    const wallet = await this.getOrCreateWallet(personId);
    const maxAllowed = Math.floor(subtotalCents * MAX_SPEND_PCT / 100);
    const maxSpendable = Math.min(wallet.balanceCents, maxAllowed);
    return {
      balanceCents: wallet.balanceCents,
      maxSpendableCents: maxSpendable,
      maxSpendPct: MAX_SPEND_PCT,
    };
  }

  // ── Admin: all wallets ─────────────────────────────────────────────────────

  async getAllWallets(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [wallets, total] = await Promise.all([
      this.db.creditWallet.findMany({
        skip,
        take: limit,
        orderBy: { balanceCents: 'desc' },
        include: { person: { select: { name: true, email: true } } },
      }),
      this.db.creditWallet.count(),
    ]);
    return { wallets, total };
  }

  async adminAdjust(personId: string, amountCents: number, reason: string, adminId: string) {
    if (amountCents === 0) throw new BadRequestException('Amount cannot be zero');
    return this.addCredits(personId, amountCents, 'ADJUSTED', `[Admin adjustment] ${reason}`);
  }

  // ── Expiry cron ────────────────────────────────────────────────────────────

  async expireOldCredits() {
    const expired = await this.db.creditTransaction.findMany({
      where: { type: 'EARNED', expiresAt: { lt: new Date() } },
      include: { wallet: true },
    });
    // Simple approach: mark expired by creating offsetting EXPIRED transaction
    for (const tx of expired) {
      const stillHasBalance = tx.wallet.balanceCents > 0;
      if (!stillHasBalance) continue;
      const deduct = Math.min(tx.amountCents, tx.wallet.balanceCents);
      await this.addCredits(tx.wallet.personId, -deduct, 'EXPIRED' as any, 'Credit expired after 12 months', tx.id);
    }
  }
}
