#!/bin/bash
# MJN Health — full deploy script
# Run this from /var/www/mjnhealthcare after git pull

set -e

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building shared packages..."
cd packages/types   && pnpm build && cd ../..
cd packages/database && npx prisma generate && pnpm build && cd ../..
cd packages/ui      && pnpm build && cd ../..

echo "==> Running database migrations..."
cd packages/database && npx prisma migrate deploy && cd ../..

echo "==> Building apps..."
pnpm --filter @mjn/api build
pnpm --filter @mjn/web build
pnpm --filter @mjn/portal build
pnpm --filter @mjn/partner build
pnpm --filter @mjn/admin build

echo "==> Restarting PM2 processes..."
pm2 startOrRestart /var/www/mjnhealthcare/ecosystem.config.js --env production

echo "==> Done. Check status with: pm2 status"
