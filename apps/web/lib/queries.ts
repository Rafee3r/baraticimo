import { prisma } from "./db";

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
  const listPrice = latest.listPrice ? Number(latest.listPrice) : null;
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
  opts: { limit?: number; inStoreOnly?: boolean } = {},
): Promise<ProductRow[]> {
  const q = query.trim();
  if (!q) return [];
  const cps = await prisma.chainProduct.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ],
      ...(opts.inStoreOnly ? { isOnlineOnly: false } : {}),
    },
    include: {
      chain: true,
      prices: { orderBy: { scrapedAt: "desc" }, take: 1 },
    },
    take: opts.limit ?? 30,
    orderBy: { lastSeenAt: "desc" },
  });
  return cps.map(rowFromChainProduct).filter((r): r is ProductRow => r !== null);
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

  return candidates
    .map(rowFromChainProduct)
    .filter((r): r is ProductRow => r !== null)
    .sort((a, b) => a.price - b.price);
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
