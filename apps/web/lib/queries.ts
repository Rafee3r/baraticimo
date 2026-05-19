import { unstable_cache } from "next/cache";
import { prisma } from "./db";

export interface OtherPrice {
  id: string;
  chainName: string;
  chainColor: string;
  chainSlug: string;
  price: number;
}

export interface ProductRow {
  id: string;
  externalId: string;
  name: string;
  brand: string | null;
  format: string | null;
  imageUrl: string | null;
  url: string;
  chainSlug: string;
  chainName: string;
  chainColor: string;
  price: number;
  listPrice: number | null;
  isOnSale: boolean;
  isOnlineOnly: boolean;
  scrapedAt: string;
  ahorro: number | null;
  ahorroPct: number | null;
  /** Categoría asignada por IA (lacteos, carnes, mascotas, bebes, ...). */
  category: string | null;
  /** Mismo producto en otras cadenas, ordenado de más barato a más caro */
  otherPrices?: OtherPrice[];
}

const CHAIN_COLORS: Record<string, string> = {
  jumbo: "#00873A",
  lider: "#0071CE",
  "santa-isabel": "#E60028",
  tottus: "#FFB81C",
  unimarc: "#003DA5",
  acuenta: "#FF6B00",
  "cruz-verde": "#00A651",
  salcobrand: "#005DAA",
  ahumada: "#E4002B",
};

function rowFromChainProduct(cp: any): ProductRow | null {
  const latest = cp.prices[0];
  if (!latest) return null;
  const price = Number(latest.price);
  // Sanity check: si el listPrice es más de 3× el precio de venta, es
  // probablemente un error de scraping (capturó el precio de otro producto).
  const rawListPrice = latest.listPrice ? Number(latest.listPrice) : null;
  const listPrice = rawListPrice && rawListPrice > price && rawListPrice <= price * 3
    ? rawListPrice
    : null;
  const ahorro = listPrice && listPrice > price ? listPrice - price : null;
  const ahorroPct = ahorro && listPrice ? Math.round((ahorro / listPrice) * 100) : null;
  return {
    id: cp.id,
    externalId: cp.externalId,
    name: cp.name,
    brand: cp.brand,
    format: cp.format,
    imageUrl: cp.imageUrl,
    url: cp.url,
    chainSlug: cp.chain.slug,
    chainName: cp.chain.name,
    chainColor: CHAIN_COLORS[cp.chain.slug] ?? "#666666",
    price,
    listPrice,
    isOnSale: latest.isOnSale,
    isOnlineOnly: cp.isOnlineOnly,
    scrapedAt: latest.scrapedAt.toISOString(),
    ahorro,
    ahorroPct,
    category: cp.category ?? null,
  };
}

/**
 * Calcula qué tan relevante es un producto para una query.
 * Prioriza productos cuyo nombre EMPIEZA con la query (ej: "Leche Entera")
 * sobre los que la contienen al final (ej: "Alimento Gato Carne y Leche").
 *
 * Score:
 *  100 — el nombre empieza exactamente con la query
 *   90 — la primera palabra del nombre ES la query
 *   70 — la query aparece en las primeras 2 palabras
 *   50 — la query aparece en la primera mitad del nombre
 *   20 — la query aparece en la segunda mitad (ingrediente, descripción)
 *    5 — la query solo aparece en brand/format, no en el nombre principal
 */
/** Normaliza string: minúsculas, sin tildes/diacríticos, sin espacios extra. */
function normalizeStr(s: string): string {
  // \p{M} = Unicode "Mark" category (combining diacritical marks).
  // Más robusto que un rango literal de caracteres invisibles.
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").trim();
}

function relevanceScore(row: ProductRow, query: string): number {
  const name = normalizeStr(row.name);
  const q = normalizeStr(query);
  const words = name.split(/\s+/);
  const half = Math.max(1, Math.floor(words.length / 2));

  if (name.startsWith(q)) return 100;
  if (words[0] === q) return 90;
  if (words.slice(0, 2).some((w) => w.startsWith(q))) return 70;
  if (words.slice(0, half).some((w) => w.includes(q))) return 50;
  if (name.includes(q)) return 20;
  return 5;
}

/**
 * Palabras que indican que el producto es para MASCOTAS.
 * Si la query no es de mascotas pero el producto sí lo es → filtrar.
 *
 * Incluye diminutivos en español ("gatito", "perrito") y razas comunes.
 */
const PET_KEYWORDS = [
  "perro", "perros", "perra", "perras", "perruno", "perruna",
  "perrito", "perritos", "perrita", "perritas",
  "gato", "gatos", "gata", "gatas", "gatuno", "felino", "felina",
  "gatito", "gatitos", "gatita", "gatitas",
  "cachorro", "cachorros", "cachorrito", "cachorrita",
  "canino", "canina", "caninos", "caninas",
  "mascota", "mascotas",
];

/** Marcas conocidas de comida de mascotas. */
const PET_BRANDS = [
  "whiskas", "pedigree", "cat chow", "master cat", "champion dog",
  "felix", "friskies", "royal canin", "hill", "hills", "purina",
  "eukanuba", "iams", "doko", "sieger", "master dog", "kibbles",
  "fancy feast", "kit cat", "nutro", "n&d", "proplan", "pro plan",
  "dog chow", "cat's life", "bekia", "fit 32", "max cat", "max dog",
  "agility", "ki-e-ki", "balanced", "champion", "fitnatura",
];

/** Patrones de "alimento balanceado" para mascotas en frases típicas. */
const PET_PHRASE_RE = /\b(alimento|comida|snack|balanceado|croquetas?|pellet|paté|pate)\s+(de\s+|para\s+)?(perro|perra|gato|gata|cachorro|gatito|perrito|mascota|canino|felino|adulto|adulta)/i;

/**
 * Palabras que indican producto de COMIDA PARA BEBÉ (papillas, coladitos).
 * Tarros chiquitos con verduras/carne que no son la "carne" que busca un adulto.
 */
const BABY_FOOD_KEYWORDS = [
  "papilla", "papillas", "colado", "picado", "naturnes",
];

const BABY_FOOD_PHRASE_RE = /\b(comida|alimento|colado|picado|papilla)\s+(de\s+|para\s+)?(bebe|bebés|infantil)/i;

function isPetProduct(row: { name: string; category: string | null }): boolean {
  // Si tiene categoría IA, es la fuente de verdad
  if (row.category === "mascotas") return true;
  if (row.category && row.category !== "mascotas") return false; // ya clasificado como otra cosa
  // Fallback heurístico solo cuando no hay categoría
  const n = normalizeStr(row.name);
  if (PET_PHRASE_RE.test(n)) return true;
  if (PET_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`).test(n))) return true;
  return PET_BRANDS.some((b) => n.includes(b));
}

function isPetQuery(query: string): boolean {
  const q = normalizeStr(query);
  if (PET_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`).test(q))) return true;
  if (PET_BRANDS.some((b) => q.includes(b))) return true;
  return /\b(croquetas?|balanceado|pellet)\b/i.test(q);
}

function isBabyFood(row: { name: string; category: string | null }): boolean {
  if (row.category === "bebes") return true;
  if (row.category && row.category !== "bebes") return false;
  const n = normalizeStr(row.name);
  if (BABY_FOOD_PHRASE_RE.test(n)) return true;
  return BABY_FOOD_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`).test(n));
}

function isBabyFoodQuery(query: string): boolean {
  const q = normalizeStr(query);
  return /\b(bebe|bebes|bebés|infantil|papilla|colado|naturnes)\b/i.test(q);
}

/**
 * Filtra resultados de baja calidad cuando existen resultados de alta calidad.
 * Reglas:
 *  - Si la query no es de mascotas, descarta productos de mascotas
 *  - Si la query no es de bebé, descarta comida de bebé
 *  - Si el mejor score es >= 70, descarta scores < 30
 */
function filterIrrelevant(rows: ProductRow[], query: string): ProductRow[] {
  if (rows.length === 0) return rows;
  const queryIsPet = isPetQuery(query);
  const queryIsBaby = isBabyFoodQuery(query);

  let filtered = rows;
  if (!queryIsPet) filtered = filtered.filter((r) => !isPetProduct(r));
  if (!queryIsBaby) filtered = filtered.filter((r) => !isBabyFood(r));

  const words = query.trim().split(/\s+/).filter((w) => w.length >= 2);
  const scoreOf = (r: ProductRow) => {
    if (words.length === 0) return 0;
    if (words.length === 1) return relevanceScore(r, words[0]!);
    return words.reduce((s, w) => s + relevanceScore(r, w), 0) / words.length;
  };

  const maxScore = filtered.reduce((m, r) => Math.max(m, scoreOf(r)), 0);
  if (maxScore >= 70) {
    filtered = filtered.filter((r) => scoreOf(r) >= 30);
  }

  // Fallback: si filtramos todo, devolver al menos algo decente
  if (filtered.length === 0 && rows.length > 0) {
    let fallback = rows;
    if (!queryIsPet) fallback = fallback.filter((r) => !isPetProduct(r));
    if (!queryIsBaby) fallback = fallback.filter((r) => !isBabyFood(r));
    return fallback.slice(0, 5);
  }
  return filtered;
}

/**
 * Ordena resultados por relevancia posicional + descuento como desempate.
 * Se usa en todas las búsquedas cuando el sort es "relevance".
 */
function sortByRelevance(rows: ProductRow[], query: string): ProductRow[] {
  // Para queries multi-palabra, score = promedio de cada palabra
  const words = query.trim().split(/\s+/).filter((w) => w.length >= 2);
  const score = (row: ProductRow) => {
    if (words.length === 1) return relevanceScore(row, words[0]!);
    const avg = words.reduce((sum, w) => sum + relevanceScore(row, w), 0) / words.length;
    // Bonus si el nombre contiene todas las palabras juntas (frase exacta)
    const name = row.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const phraseBonus = words.every((w) =>
      name.includes(w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""))
    ) ? 15 : 0;
    return avg + phraseBonus;
  };

  return [...rows].sort((a, b) => {
    const diff = score(b) - score(a);
    if (Math.abs(diff) > 5) return diff;
    // Desempate: isOnSale y luego ahorroPct
    if (a.isOnSale !== b.isOnSale) return a.isOnSale ? -1 : 1;
    return (b.ahorroPct ?? 0) - (a.ahorroPct ?? 0);
  });
}

/**
 * Normaliza un nombre de producto para agrupar duplicados entre cadenas.
 * Elimina formatos (1kg, 500ml), números sueltos y puntuación.
 * Toma las primeras 5 palabras significativas como clave de grupo.
 */
/**
 * Stopwords y prefijos basura comunes en nombres de productos scrapeados.
 * Se quitan ANTES de generar la clave de dedup para que el mismo producto
 * en distintas cadenas matchee aunque venga con texto extra.
 */
const STOPWORDS = new Set([
  "agregar", "comprar", "para", "con", "sin", "del", "los", "las",
  "una", "uno", "esta", "este", "esa", "ese", "que", "por", "tu", "de", "el", "la",
]);

function dedupKey(name: string): string {
  return normalizeStr(name)
    // Quitar prefijo "Agregar<marca-lowercase>" si quedó pegado
    .replace(/^agregar[a-z\s]+?(?=[a-z]{4,})/i, "")
    // Quitar formatos: 1kg, 500g, 1.5l, 12 un, pack x4, etc.
    .replace(/\b\d+([.,]\d+)?\s*(kg|g|ml|l|lt|cc|gr|un|pack|x\s*\d+|grs|litros?|kilos?|gramos?|mililitros?|cm)\b/gi, "")
    .replace(/\b\d+\s*x\s*\d+\b/gi, "") // packs "6 x 350"
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
    .slice(0, 5)
    .join(" ");
}

/**
 * Agrupa una lista de ProductRow por nombre normalizado.
 * Para cada grupo, el producto más barato es el "primario" y los demás
 * se adjuntan como `otherPrices`. Elimina duplicados del mismo producto
 * en la misma cadena (se queda con el más barato).
 */
export function dedupResults(rows: ProductRow[]): ProductRow[] {
  const groups = new Map<string, ProductRow[]>();

  for (const row of rows) {
    const key = dedupKey(row.name);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  const result: ProductRow[] = [];

  for (const group of groups.values()) {
    // Dentro del grupo: una entrada por cadena (la más barata de esa cadena)
    const byChain = new Map<string, ProductRow>();
    for (const r of group) {
      const existing = byChain.get(r.chainSlug);
      if (!existing || r.price < existing.price) byChain.set(r.chainSlug, r);
    }

    const sorted = [...byChain.values()].sort((a, b) => a.price - b.price);
    const primary = sorted[0]!;
    const others: OtherPrice[] = sorted.slice(1).map((r) => ({
      id: r.id,
      chainName: r.chainName,
      chainColor: r.chainColor,
      chainSlug: r.chainSlug,
      price: r.price,
    }));

    result.push({ ...primary, otherPrices: others.length > 0 ? others : undefined });
  }

  return result;
}

/** Productos destacados para el home: ofertas con buen % de descuento. */
export async function getFeaturedProducts(limit = 12): Promise<ProductRow[]> {
  const cps = await prisma.chainProduct.findMany({
    include: {
      chain: true,
      prices: { orderBy: { scrapedAt: "desc" }, take: 1 },
    },
    take: 200,
    orderBy: { lastSeenAt: "desc" },
  });
  const rows = cps
    .map(rowFromChainProduct)
    .filter((r): r is ProductRow => r !== null)
    .filter((r) => r.isOnSale && r.ahorroPct !== null)
    .sort((a, b) => (b.ahorroPct ?? 0) - (a.ahorroPct ?? 0))
    .slice(0, limit);
  return rows;
}

/**
 * Busca IDs de ChainProduct cuyo nombre (sin acentos, lowercase) contenga TODOS los
 * términos dados (AND). Usa f_unaccent + ILIKE para tolerar tildes:
 * 'atun' matchea 'atún' y viceversa.
 */
async function findIdsByTerms(
  terms: string[],
  opts: { inStoreOnly?: boolean; chainSlug?: string; limit: number },
): Promise<string[]> {
  if (terms.length === 0) return [];

  const conditions: string[] = [];
  const params: any[] = [];

  for (const t of terms) {
    params.push(`%${t.toLowerCase()}%`);
    conditions.push(
      `(public.f_unaccent(lower(cp.name)) LIKE public.f_unaccent($${params.length}) OR ` +
      `public.f_unaccent(lower(coalesce(cp.brand, ''))) LIKE public.f_unaccent($${params.length}))`
    );
  }

  let where = conditions.join(" AND ");
  if (opts.inStoreOnly) where += ` AND cp."isOnlineOnly" = false`;
  if (opts.chainSlug) {
    params.push(opts.chainSlug);
    where += ` AND c.slug = $${params.length}`;
  }

  params.push(opts.limit);
  const limitParam = `$${params.length}`;

  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT cp.id FROM "ChainProduct" cp JOIN "Chain" c ON c.id = cp."chainId"
     WHERE ${where}
     ORDER BY cp."lastSeenAt" DESC
     LIMIT ${limitParam}`,
    ...params,
  );
  return rows.map((r) => r.id);
}

/** Búsqueda con unaccent (tildes-insensible) en nombre + marca. */
export async function searchProducts(
  query: string,
  opts: {
    limit?: number;
    inStoreOnly?: boolean;
    sort?: "relevance" | "price_asc" | "price_desc" | "discount";
    chainSlug?: string;
  } = {},
): Promise<ProductRow[]> {
  const q = query.trim();
  if (!q) return [];

  const include = {
    chain: true,
    prices: { orderBy: { scrapedAt: "desc" as const }, take: 1 },
  };

  const words = q.split(/\s+/).filter((w) => w.length >= 2);
  const limit = opts.limit ?? 30;
  let ids: string[];

  if (words.length >= 2) {
    // Intentar AND: todas las palabras presentes
    ids = await findIdsByTerms(words, { ...opts, limit });
    if (ids.length < 2) {
      // Fallback: frase exacta como una sola term
      ids = await findIdsByTerms([q], { ...opts, limit });
    }
  } else {
    ids = await findIdsByTerms([q], { ...opts, limit });
  }

  // Cargar productos completos con include
  const cps = ids.length > 0
    ? await prisma.chainProduct.findMany({
        where: { id: { in: ids } },
        include,
      })
    : [];
  // Mantener orden por lastSeenAt (el orden de IDs)
  const order = new Map(ids.map((id, i) => [id, i]));
  cps.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  // Si no hubo resultados con el query, return early
  if (cps.length === 0) {
    return [];
  }

  // Saltar el bloque legacy de findMany abajo, salir aquí:
  let rows = cps.map(rowFromChainProduct).filter((r): r is ProductRow => r !== null);
  rows = filterIrrelevant(rows, q);
  if (opts.sort === "price_asc") rows = rows.sort((a, b) => a.price - b.price);
  else if (opts.sort === "price_desc") rows = rows.sort((a, b) => b.price - a.price);
  else if (opts.sort === "discount") rows = rows.sort((a, b) => (b.ahorroPct ?? 0) - (a.ahorroPct ?? 0));
  else rows = sortByRelevance(rows, q);
  return rows;
}

// ── Búsqueda legacy (sin unaccent) — la dejo deshabilitada por refactor arriba.
async function _legacy_searchProducts_unused(
  query: string,
  opts: {
    limit?: number;
    inStoreOnly?: boolean;
    sort?: "relevance" | "price_asc" | "price_desc" | "discount";
    chainSlug?: string;
  } = {},
): Promise<ProductRow[]> {
  const q = query.trim();
  const base = {
    ...(opts.inStoreOnly ? { isOnlineOnly: false } : {}),
    ...(opts.chainSlug ? { chain: { slug: opts.chainSlug } } : {}),
  };
  const include = {
    chain: true,
    prices: { orderBy: { scrapedAt: "desc" as const }, take: 1 },
  };
  const words = q.split(/\s+/).filter((w) => w.length >= 2);
  let cps: any[];
  if (words.length >= 2) {
    const andCps = await prisma.chainProduct.findMany({
      where: {
        AND: words.map((w) => ({ name: { contains: w, mode: "insensitive" as const } })),
        ...base,
      },
      include,
      take: opts.limit ?? 30,
      orderBy: { lastSeenAt: "desc" },
    });
    if (andCps.length >= 2) {
      cps = andCps;
    } else {
      cps = await prisma.chainProduct.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
          ],
          ...base,
        },
        include,
        take: opts.limit ?? 30,
        orderBy: { lastSeenAt: "desc" },
      });
    }
  } else {
    cps = await prisma.chainProduct.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
        ],
        ...base,
      },
      include,
      take: opts.limit ?? 30,
      orderBy: { lastSeenAt: "desc" },
    });
  }

  let rows = cps.map(rowFromChainProduct).filter((r): r is ProductRow => r !== null);

  // Filtrar resultados irrelevantes (mascotas cuando no se pide, baja relevancia
  // cuando hay matches buenos disponibles)
  rows = filterIrrelevant(rows, q);

  if (opts.sort === "price_asc") rows = rows.sort((a, b) => a.price - b.price);
  else if (opts.sort === "price_desc") rows = rows.sort((a, b) => b.price - a.price);
  else if (opts.sort === "discount") rows = rows.sort((a, b) => (b.ahorroPct ?? 0) - (a.ahorroPct ?? 0));
  else rows = sortByRelevance(rows, q); // "relevance" (default)
  return rows;
}

/** Detalle de un producto + historial de precios. */
export async function getProductDetail(id: string) {
  const cp = await prisma.chainProduct.findUnique({
    where: { id },
    include: {
      chain: true,
      prices: { orderBy: { scrapedAt: "desc" }, take: 30 },
    },
  });
  if (!cp) return null;
  const latest = cp.prices[0];
  if (!latest) return null;
  const row = rowFromChainProduct(cp)!;
  const history = cp.prices
    .slice()
    .reverse()
    .map((p) => ({
      at: p.scrapedAt.toISOString(),
      price: Number(p.price),
    }));
  return { row, history };
}

/** Total de productos para mostrar en la UI. */
export async function getStats() {
  const [productCount, priceCount, saleCount, onlineOnlyCount] = await Promise.all([
    prisma.chainProduct.count(),
    prisma.price.count(),
    prisma.price.count({ where: { isOnSale: true } }),
    prisma.chainProduct.count({ where: { isOnlineOnly: true } }),
  ]);
  return { productCount, priceCount, saleCount, onlineOnlyCount };
}

/** Productos por ID (para lista y favoritos). */
export async function getProductsByIds(ids: string[]): Promise<ProductRow[]> {
  if (ids.length === 0) return [];
  const cps = await prisma.chainProduct.findMany({
    where: { id: { in: ids } },
    include: {
      chain: true,
      prices: { orderBy: { scrapedAt: "desc" }, take: 1 },
    },
  });
  return cps.map(rowFromChainProduct).filter((r): r is ProductRow => r !== null);
}

/** Encontrar el mismo producto en otras cadenas usando similitud de nombre. */
export async function getCrossChainMatches(
  productId: string,
  limit = 5,
): Promise<ProductRow[]> {
  const source = await prisma.chainProduct.findUnique({
    where: { id: productId },
    select: { name: true, chainId: true },
  });
  if (!source) return [];

  // Heurística simple: tomar las 3 palabras más largas del nombre y buscar
  // chainProducts en OTRAS cadenas que las contengan todas.
  const words = source.name
    .toLowerCase()
    .replace(/[^\wáéíóúñ\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);

  if (words.length === 0) return [];

  const candidates = await prisma.chainProduct.findMany({
    where: {
      chainId: { not: source.chainId },
      AND: words.map((w) => ({ name: { contains: w, mode: "insensitive" as const } })),
    },
    include: {
      chain: true,
      prices: { orderBy: { scrapedAt: "desc" }, take: 1 },
    },
    take: limit,
  });

  // Obtener el precio del producto fuente para filtrar por ratio
  const sourceProduct = await prisma.chainProduct.findUnique({
    where: { id: productId },
    include: { prices: { orderBy: { scrapedAt: "desc" }, take: 1 } },
  });
  const sourcePrice = sourceProduct?.prices[0] ? Number(sourceProduct.prices[0].price) : null;

  return candidates
    .map(rowFromChainProduct)
    .filter((r): r is ProductRow => {
      if (!r) return false;
      // Filtro de ratio: descartar matches con diferencia de precio mayor a 3x.
      // Evita comparar un sachet de $890 con un pack de $24.500.
      if (sourcePrice && sourcePrice > 0) {
        const ratio = Math.max(r.price, sourcePrice) / Math.min(r.price, sourcePrice);
        if (ratio > 3) return false;
      }
      return true;
    })
    .sort((a, b) => a.price - b.price);
}

/**
 * Búsqueda por múltiples keywords — usada por smartSearch.
 *
 * Con múltiples keywords intenta AND primero (todas las palabras deben aparecer
 * en el nombre). Si el resultado es insuficiente cae a OR para no quedarse sin
 * resultados. Esto evita que "leche chocolate" devuelva comida de mascotas que
 * solo contiene "leche" en el nombre.
 */
export async function searchProductsByKeywords(
  keywords: string[],
  opts: { limit?: number; inStoreOnly?: boolean } = {},
): Promise<ProductRow[]> {
  if (keywords.length === 0) return [];

  const include = {
    chain: true,
    prices: { orderBy: { scrapedAt: "desc" as const }, take: 1 },
  };
  const base = opts.inStoreOnly ? { isOnlineOnly: false } : {};

  // Intentar AND cuando hay 2+ keywords: todas deben aparecer en el nombre
  if (keywords.length >= 2) {
    const andCps = await prisma.chainProduct.findMany({
      where: {
        AND: keywords.map((k) => ({
          name: { contains: k, mode: "insensitive" as const },
        })),
        ...base,
      },
      include,
      take: opts.limit ?? 80,
      orderBy: { lastSeenAt: "desc" },
    });
    const andRows = andCps.map(rowFromChainProduct).filter((r): r is ProductRow => r !== null);
    if (andRows.length >= 4) {
      const cleanAnd = filterIrrelevant(andRows, keywords.join(" "));
      return sortByRelevance(cleanAnd, keywords.join(" "));
    }

    // AND dio pocos resultados — completar con OR pero priorizando los AND
    const orCps = await prisma.chainProduct.findMany({
      where: {
        OR: keywords.flatMap((k) => [
          { name: { contains: k, mode: "insensitive" as const } },
          { brand: { contains: k, mode: "insensitive" as const } },
        ]),
        ...base,
      },
      include,
      take: opts.limit ?? 80,
      orderBy: { lastSeenAt: "desc" },
    });
    const orRows = orCps.map(rowFromChainProduct).filter((r): r is ProductRow => r !== null);

    // Merge: resultados AND primero, luego OR sin duplicados, todo por relevancia
    const seen = new Set(andRows.map((r) => r.id));
    const merged = [...andRows, ...orRows.filter((r) => !seen.has(r.id))];
    const cleanMerged = filterIrrelevant(merged, keywords.join(" "));
    return sortByRelevance(cleanMerged, keywords.join(" ")).slice(0, opts.limit ?? 80);
  }

  // Con 1 sola keyword usar OR normal (incluye name + brand)
  const cps = await prisma.chainProduct.findMany({
    where: {
      OR: keywords.flatMap((k) => [
        { name: { contains: k, mode: "insensitive" as const } },
        { brand: { contains: k, mode: "insensitive" as const } },
      ]),
      ...base,
    },
    include,
    take: opts.limit ?? 80,
    orderBy: { lastSeenAt: "desc" },
  });
  const rows = cps.map(rowFromChainProduct).filter((r): r is ProductRow => r !== null);
  const clean = filterIrrelevant(rows, keywords[0] ?? "");
  return sortByRelevance(clean, keywords[0] ?? "");
}

/** Cadenas con al menos 1 producto (para filtros de búsqueda). */
export async function getChainsWithProducts() {
  return prisma.chain.findMany({
    where: { isActive: true, chainProducts: { some: {} } },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** CrossChainDeal: un producto más barato en cadena A vs cadena B. */
export interface CrossChainDeal {
  cheaper: ProductRow;
  pricier: ProductRow;
  savings: number;
  savingsPct: number;
}

const _computeDeals = unstable_cache(
  async (limit: number): Promise<CrossChainDeal[]> => {
    const featured = await getFeaturedProducts(40);
    const deals: CrossChainDeal[] = [];
    // Máximo 45% de ahorro y mínimo $300 de diferencia para que el deal sea creíble.
    // Evita mostrar comparaciones donde el "match" no es el mismo producto.
    const MAX_SAVINGS_PCT = 45;
    const MIN_SAVINGS_ABS = 300;

    for (const product of featured) {
      if (deals.length >= limit * 3) break;
      const matches = await getCrossChainMatches(product.id, 3);

      for (const match of matches) {
        const low = Math.min(product.price, match.price);
        const high = Math.max(product.price, match.price);
        const savings = high - low;
        const savingsPct = Math.round((savings / high) * 100);

        // Filtros de calidad: diferencia mínima $300 y máximo 45%
        if (savings < MIN_SAVINGS_ABS) continue;
        if (savingsPct > MAX_SAVINGS_PCT) continue;

        const cheaper = product.price <= match.price ? product : match;
        const pricier = product.price <= match.price ? match : product;

        deals.push({ cheaper, pricier, savings, savingsPct });
        break; // 1 deal por producto fuente es suficiente
      }
    }
    return deals.sort((a, b) => b.savings - a.savings).slice(0, limit);
  },
  ["top-cross-chain-deals"],
  { revalidate: 1800 },
);

export async function getTopCrossChainDeals(limit = 6): Promise<CrossChainDeal[]> {
  return _computeDeals(limit);
}

/** Las 8 categorías de la home en formato (categoría → 6 productos top). */
export async function getOffersByKeyword(keyword: string, limit = 8): Promise<ProductRow[]> {
  const cps = await prisma.chainProduct.findMany({
    where: { name: { contains: keyword, mode: "insensitive" } },
    include: {
      chain: true,
      prices: { orderBy: { scrapedAt: "desc" }, take: 1 },
    },
    take: 50,
    orderBy: { lastSeenAt: "desc" },
  });
  return cps
    .map(rowFromChainProduct)
    .filter((r): r is ProductRow => r !== null)
    .sort((a, b) => {
      // Priorizar ofertas con buen %
      const aP = a.ahorroPct ?? -1;
      const bP = b.ahorroPct ?? -1;
      return bP - aP;
    })
    .slice(0, limit);
}

/**
 * Productos destacados de una categoría real (el campo `category` clasificado por IA).
 * Reemplaza a getOffersByKeyword cuando hay categorías disponibles — es más preciso
 * porque no depende de matchear texto en el nombre.
 */
export async function getOffersByCategory(category: string, limit = 8): Promise<ProductRow[]> {
  const cps = await prisma.chainProduct.findMany({
    where: { category },
    include: {
      chain: true,
      prices: { orderBy: { scrapedAt: "desc" }, take: 1 },
    },
    take: 80,
    orderBy: { lastSeenAt: "desc" },
  });
  return cps
    .map(rowFromChainProduct)
    .filter((r): r is ProductRow => r !== null)
    .sort((a, b) => {
      // Ofertas con descuento primero, luego ordenado por % ahorro
      if (a.isOnSale !== b.isOnSale) return a.isOnSale ? -1 : 1;
      return (b.ahorroPct ?? 0) - (a.ahorroPct ?? 0);
    })
    .slice(0, limit);
}

/** Búsqueda por categoría real (no por keyword). */
export async function searchByCategory(
  category: string,
  opts: { limit?: number; inStoreOnly?: boolean; chainSlug?: string } = {},
): Promise<ProductRow[]> {
  const cps = await prisma.chainProduct.findMany({
    where: {
      category,
      ...(opts.inStoreOnly ? { isOnlineOnly: false } : {}),
      ...(opts.chainSlug ? { chain: { slug: opts.chainSlug } } : {}),
    },
    include: {
      chain: true,
      prices: { orderBy: { scrapedAt: "desc" }, take: 1 },
    },
    take: opts.limit ?? 200,
    orderBy: { lastSeenAt: "desc" },
  });
  return cps.map(rowFromChainProduct).filter((r): r is ProductRow => r !== null);
}
