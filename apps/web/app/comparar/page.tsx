import { searchProducts, getCrossChainMatches } from "../../lib/queries";
import { smartSearch } from "../../lib/ai-search";
import { SearchInput } from "../../components/SearchInput";
import { AddToListButton } from "../../components/AddToListButton";
import Link from "next/link";

export const revalidate = 180;
export const metadata = { title: "Comparar — Baratícimo" };

function formatCLP(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

const SUGGESTIONS = ["leche entera", "pan de molde", "arroz", "aceite", "detergente"];

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function CompararPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;

  let groups: Array<{
    product: Awaited<ReturnType<typeof searchProducts>>[number];
    matches: Awaited<ReturnType<typeof getCrossChainMatches>>;
  }> = [];

  if (q.trim()) {
    const results = await smartSearch(q, { limit: 5 }).catch(() =>
      searchProducts(q, { limit: 5 }),
    );

    groups = await Promise.all(
      results.map(async (product) => {
        const matches = await getCrossChainMatches(product.id, 5);
        return { product, matches };
      }),
    );

    // Filter to groups that have at least 1 match for a useful comparison
    groups = groups.filter((g) => g.matches.length > 0);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pt-4 sm:px-6 sm:pt-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 text-white">
        <h1 className="text-xl font-bold">🔀 Comparar precios</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Busca un producto y ve cuánto cuesta en cada cadena
        </p>
        <div className="mt-4">
          <SearchInput action="/comparar" size="md" />
        </div>
      </div>

      {/* Empty state */}
      {!q.trim() && (
        <div className="mt-10 text-center">
          <div className="text-5xl">🔀</div>
          <p className="mt-3 font-medium text-neutral-700">¿Qué quieres comparar?</p>
          <p className="mt-1 text-sm text-neutral-500">
            Busca cualquier producto para ver su precio en todas las cadenas disponibles.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <Link
                key={s}
                href={`/comparar?q=${encodeURIComponent(s)}`}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-700 ring-1 ring-neutral-200 hover:ring-neutral-300 transition"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {q.trim() && groups.length === 0 && (
        <div className="mt-10 rounded-2xl bg-white p-8 text-center ring-1 ring-neutral-200">
          <div className="text-4xl">🤔</div>
          <p className="mt-3 font-medium">Sin comparativas para "{q}"</p>
          <p className="mt-1 text-sm text-neutral-500">
            No encontramos este producto en más de una cadena aún.
          </p>
        </div>
      )}

      {/* Results */}
      {groups.length > 0 && (
        <div className="mt-6 space-y-6">
          {groups.map(({ product: p, matches }) => {
            const allPrices = [p, ...matches].sort((a, b) => a.price - b.price);
            const cheapest = allPrices[0]!;
            const priciest = allPrices[allPrices.length - 1]!;
            const maxSavings = priciest.price - cheapest.price;

            return (
              <div key={p.id} className="overflow-hidden rounded-3xl bg-white ring-1 ring-neutral-200">
                {/* Product header */}
                <div className="flex items-start gap-4 p-5 pb-4">
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-14 w-14 shrink-0 rounded-xl bg-neutral-50 object-contain p-1"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/producto/${p.id}`}
                      className="line-clamp-2 font-semibold leading-tight hover:underline"
                    >
                      {p.name}
                    </Link>
                    {maxSavings > 0 && (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                        Ahorra hasta {formatCLP(maxSavings)} eligiendo bien
                      </div>
                    )}
                  </div>
                </div>

                {/* Price table */}
                <table className="w-full text-sm">
                  <tbody>
                    {allPrices.map((v, i) => {
                      const isCheapest = i === 0;
                      const diff = v.price - cheapest.price;
                      return (
                        <tr
                          key={v.id}
                          className={`border-t border-neutral-100 ${isCheapest ? "bg-emerald-50" : ""}`}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ background: v.chainColor }}
                              />
                              <span className="font-medium">{v.chainName}</span>
                              {isCheapest && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  🏆
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span
                              className={`text-base font-bold ${isCheapest ? "text-emerald-700" : "text-neutral-700"}`}
                            >
                              {formatCLP(v.price)}
                            </span>
                            {diff > 0 && (
                              <div className="text-[10px] text-red-500">+{formatCLP(diff)}</div>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <AddToListButton productId={v.id} size="sm" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <p className="px-5 pb-4 pt-2 text-[11px] text-neutral-400">
                  Precios del sitio web · otras cadenas por similitud de nombre
                </p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
