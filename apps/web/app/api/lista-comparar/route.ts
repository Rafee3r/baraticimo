/**
 * POST /api/lista-comparar
 *
 * Recibe la lista del usuario y calcula cuánto saldría comprar
 * los mismos productos en cada cadena disponible, usando los
 * matches cross-chain existentes.
 *
 * Input:  { items: { id: string; qty: number }[] }
 * Output: { chains: ChainTotal[]; totalItems: number }
 */
import { NextResponse } from "next/server";
import { getProductsByIds, getCrossChainMatches } from "../../../lib/queries";

export interface ChainTotal {
  chainSlug: string;
  chainName: string;
  chainColor: string;
  total: number;
  /** Cuántos ítems de la lista tienen precio en esta cadena */
  covered: number;
  totalItems: number;
}

export async function POST(req: Request) {
  try {
    const { items } = await req.json() as { items: { id: string; qty: number }[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ chains: [], totalItems: 0 });
    }

    const ids = items.map((i) => i.id);
    const products = await getProductsByIds(ids);

    if (products.length === 0) {
      return NextResponse.json({ chains: [], totalItems: 0 });
    }

    // Para cada producto, buscar matches en otras cadenas (en paralelo)
    const withMatches = await Promise.all(
      products.map(async (p) => ({
        product: p,
        qty: items.find((i) => i.id === p.id)?.qty ?? 1,
        matches: await getCrossChainMatches(p.id, 6),
      })),
    );

    const totalItems = withMatches.length;

    // Por cada cadena, acumular el total usando el precio más barato disponible
    const chainMap = new Map<
      string,
      { chainSlug: string; chainName: string; chainColor: string; total: number; covered: number }
    >();

    for (const { product, qty, matches } of withMatches) {
      // Todas las opciones disponibles para este producto (propia + matches)
      const allOptions = [product, ...matches];

      // Precio más barato por cadena para este producto
      const bestPerChain = new Map<string, { price: number; chainSlug: string; chainName: string; chainColor: string }>();
      for (const opt of allOptions) {
        const prev = bestPerChain.get(opt.chainSlug);
        if (!prev || opt.price < prev.price) {
          bestPerChain.set(opt.chainSlug, {
            price: opt.price,
            chainSlug: opt.chainSlug,
            chainName: opt.chainName,
            chainColor: opt.chainColor,
          });
        }
      }

      // Sumar al total de cada cadena
      for (const [slug, { price, chainSlug, chainName, chainColor }] of bestPerChain) {
        const cur = chainMap.get(slug) ?? { chainSlug, chainName, chainColor, total: 0, covered: 0 };
        cur.total += price * qty;
        cur.covered += 1;
        chainMap.set(slug, cur);
      }
    }

    // Ordenar: primero las cadenas con más cobertura, luego por precio total ascendente
    const chains: ChainTotal[] = Array.from(chainMap.values())
      .map((c) => ({ ...c, totalItems }))
      .sort((a, b) => {
        if (b.covered !== a.covered) return b.covered - a.covered;
        return a.total - b.total;
      });

    return NextResponse.json({ chains, totalItems });
  } catch (err) {
    console.error("[lista-comparar]", err);
    return NextResponse.json({ chains: [], totalItems: 0 }, { status: 500 });
  }
}
