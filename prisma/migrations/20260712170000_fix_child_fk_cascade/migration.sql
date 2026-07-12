-- Fix orphan FK: SaleItem/StockMovement reference Product without cascade,
-- which blocked tenant deletion (cascade chain broke). Use CASCADE so deleting
-- a Product (or its Tenant) removes the snapshot rows too.
ALTER TABLE "SaleItem" DROP CONSTRAINT IF EXISTS "SaleItem_productId_fkey",
  ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_productId_fkey",
  ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON UPDATE CASCADE ON DELETE CASCADE;
