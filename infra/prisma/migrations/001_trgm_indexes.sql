-- Migración 001: Índices GIN trigram para búsqueda rápida
-- Ejecutar con: pnpm db:migrate
-- Requiere: PostgreSQL con extensión pg_trgm (disponible en Neon y la mayoría de PG cloud)
--
-- Sin estos índices, cada búsqueda ILIKE '%query%' hace un full-table-scan.
-- Con GIN trigram, la misma query usa el índice → 10-100× más rápido.

-- 1. Habilitar extensión (idempotente)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Índice trigram en ChainProduct.name (la columna más consultada)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ChainProduct_name_trgm_idx"
  ON "ChainProduct" USING GIN (name gin_trgm_ops);

-- 3. Índice trigram en ChainProduct.brand (buscada junto con name)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ChainProduct_brand_trgm_idx"
  ON "ChainProduct" USING GIN (brand gin_trgm_ops)
  WHERE brand IS NOT NULL;

-- 4. Índice trigram en Product.name (producto canónico, usado en matcher)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_name_trgm_idx"
  ON "Product" USING GIN (name gin_trgm_ops);

-- 5. Índice B-tree en ChainProduct.lastSeenAt (ORDER BY en getFeaturedProducts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ChainProduct_lastSeenAt_idx"
  ON "ChainProduct" (lastSeenAt DESC);
