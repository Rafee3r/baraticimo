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
  /** Mismo producto en otras cadenas, ordenado de más barato a más caro */
  otherPrices?: OtherPrice[];
}

const CHAIN_COLORS: Record<string, string> = {
  jumbo: "#00873A",
  lider: "#0071CE",
  "santa-isabel": "#E60028",
  tottus: "#FFB81C",
  unimarc: "#003DA5",
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
 * Esto evita que "pollo" devuelva "Alimento perro sabor pollo".
 */
const PET_KEYWORDS = [
  "perro", "perros", "perra", "perras", "perruno", "perruna",
  "gato", "gatos", "gata", "gatas", "gatuno", "felino", "felina",
  "cachorro", "cachorros", "canino", "canina",
  "mascota", "mascotas",
];

/** Patrones de "alimento balanceado" para mascotas en frases típicas. */
const PET_PHRASE_RE = /\b(alimento|comida|snack|balanceado|croquetas?)\s+(de\s+|para\s+)?(perro|perra|gato|gata|cachorro|mascota|canino|felino|adulto)/i;

function isPetProduct(name: string): boolean {
  const n = normalizeStr(name);
  if (PET_PHRASE_RE.test(n)) return true;
  return PET_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`).test(n));
}

function isPetQuery(query: string): boolean {
  const q = normalizeStr(query);
  return PET_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`).test(q)) ||
    /\b(croquetas?|balanceado)\b/i.test(q);
}

/**
 * Filtra resultados de baja calidad cuando existen resultados de alta calidad.
 * Reglas:
 *  - Si la query no es de mascotas, descarta productos de mascotas (siempre).
 *  - Si el mejor score es >= 70 (match de calidad), descarta scores < 30.
 */
function filterIrrelevant(rows: ProductRow[], query: string): ProductRow[] {
  if (rows.length === 0) return rows;
  const queryIsPet = isPetQuery(query);

  let filtered = queryIsPet ? rows : rows.filter((r) => !isPetProduct(r.name));

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

  // Fallback: si filtramos todo (caso raro), devolver al menos algo
  if (filtered.length === 0 && rows.length > 0) {
    return queryIsPet ? rows : rows.filter((r) => !isPetProduct(r.name)).slice(0, 5);
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
function dedupKey(name: string): string {
  return normalizeStr(name)
    .replace(/\b\d+\s*(kg|g|ml|l|lt|cc|gr|un|pack|x\s*\d+)\b/gi, "") // quitar formatos
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
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

/** Búsqueda case-insensitive en el nombre + marca. */
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

  const base = {
    ...(opts.inStoreOnly ? { isOnlineOnly: false } : {}),
    ...(opts.chainSlug ? { chain: { slug: opts.chainSlug } } : {}),
  };
  const include = {
    chain: true,
    prices: { orderBy: { scrapedAt: "desc" as const }, take: 1 },
  };

  // Si hay múltiples palabras, intentar AND primero (todas las palabras en el nombre).
  // Esto da resultados mucho más precisos para búsquedas como "leche chocolate".
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
      // Fallback a búsqueda de frase exacta
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
    where: { chainProducts: { some: {} } },
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
