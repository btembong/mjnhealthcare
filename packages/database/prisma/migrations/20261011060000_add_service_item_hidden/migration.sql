-- Catalog: a service can be hidden (no longer offered) without losing its order history.
ALTER TABLE "service_items" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
