-- Habilita búsqueda insensible a acentos: "atun" matchea "atún", etc.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- unaccent() no es IMMUTABLE por defecto, así que no se puede usar en
-- índices directamente. Creamos un wrapper IMMUTABLE.
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1);
$$ LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE;

-- Índices trigram sobre unaccent(lower(...)). Aceleran ILIKE/similar
-- sobre nombres con acentos.
CREATE INDEX IF NOT EXISTS "ChainProduct_name_unaccent_idx"
  ON "ChainProduct"
  USING GIN (public.f_unaccent(lower(name)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChainProduct_brand_unaccent_idx"
  ON "ChainProduct"
  USING GIN (public.f_unaccent(lower(coalesce(brand, ''))) gin_trgm_ops);
