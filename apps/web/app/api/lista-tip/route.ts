import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getProductsByIds, getCrossChainMatches } from "../../../lib/queries";
import { callDeepSeekText } from "../../../lib/ai";

function formatCLP(n: number) {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

const computeTip = unstable_cache(
  async (
    sortedIds: string,
    rawItems: string,
  ): Promise<string | null> => {
    const items: { id: string; qty: number }[] = JSON.parse(rawItems);
    if (items.length < 3) return null;

    const products = await getProductsByIds(items.map((i) => i.id));
    if (products.length < 3) return null;

    // Para cada producto busca alternativas más baratas en otras cadenas
    const comparisons = await Promise.all(
      products.map(async (p) => {
        const qty = items.find((i) => i.id === p.id)?.qty ?? 1;
        const matches = await getCrossChainMatches(p.id, 3);
        const cheaper = matches
          .filter((m) => m.price < p.price)
          .sort((a, b) => a.price - b.price);
        return { product: p, qty, cheaperMatches: cheaper };
      }),
    );

    // Calcular ahorro total posible
    let totalSavings = 0;
    for (const { product, qty, cheaperMatches } of comparisons) {
      if (cheaperMatches[0]) {
        totalSavings += (product.price - cheaperMatches[0].price) * qty;
      }
    }

    // Gate: no vale la pena si el ahorro es menor a $1.000
    if (totalSavings < 1000) return null;

    // Construir resumen compacto para la IA
    const lines = comparisons
      .filter((d) => d.cheaperMatches[0])
      .map(({ product, qty, cheaperMatches }) => {
        const best = cheaperMatches[0]!;
        const saving = (product.price - best.price) * qty;
        return `${product.name.slice(0, 35)} x${qty}: ${formatCLP(product.price)} (${product.chainName}) vs ${formatCLP(best.price)} (${best.chainName}), ahorro ${formatCLP(saving)}`;
      });

    if (lines.length === 0) return null;

    const tip = await callDeepSeekText(
      "Genera 1 oración en español chileno (máx 20 palabras) con un consejo de ahorro concreto para esta lista de supermercado. Menciona la cadena y el monto. Sé directo y amigable.",
      `${lines.join(". ")}. Ahorro total posible: ${formatCLP(totalSavings)}.`,
    );

    return tip.replace(/^["']|["']$/g, "").trim(); // quitar comillas si el modelo las agrega
  },
  ["lista-tip"],
  { revalidate: 1800 }, // 30 min
);

export async function POST(req: Request) {
  try {
    const { items } = (await req.json()) as {
      items: { id: string; qty: number }[];
    };
    if (!items || items.length < 3) {
      return NextResponse.json({ tip: null });
    }

    // La clave de caché ordena los IDs para que {A,B} y {B,A} sean la misma lista
    const sortedIds = items
      .map((i) => i.id)
      .sort()
      .join(",");

    const tip = await computeTip(sortedIds, JSON.stringify(items));
    return NextResponse.json({ tip });
  } catch {
    return NextResponse.json({ tip: null });
  }
}
