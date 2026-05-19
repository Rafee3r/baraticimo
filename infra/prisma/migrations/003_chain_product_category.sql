-- Categoría asignada por IA a cada ChainProduct
-- Una de: despensa, lacteos, carnes, frutas-verduras, bebidas, snacks,
--         congelados, limpieza, belleza, bebes, mascotas, farmacia,
--         panaderia, desayuno, otros

ALTER TABLE "ChainProduct" ADD COLUMN IF NOT EXISTS "category" TEXT;

CREATE INDEX IF NOT EXISTS "ChainProduct_category_idx" ON "ChainProduct"("category");
