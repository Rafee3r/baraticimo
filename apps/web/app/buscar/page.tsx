import Link from "next/link";
import { searchProducts, getChainsWithProducts, dedupResults } from "../../lib/queries";
import { smartSearch } from "../../lib/ai-search";
import { SearchInput } from "../../components/SearchInput";
import { ProductCard } from "../../components/ProductCard";

export const revalidate = 120;

type Sort = "relevance" | "price_asc" | "price_desc" | "discount";

interface Props {
  searchParams: Promise<{ q?: string; tienda?: string; ofertas?: string; sort?: string; cadena?: string }>;
}

const SORTS: { value: Sort; label: string }[] = [
  { value: "relevance", label: "Relevancia" },
  { value: "price_asc", label: "Precio ↑" },
  { value: "price_desc", label: "Precio ↓" },
  { value: "discount", label: "Mayor descuento" },
];

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", tienda, ofertas, sort = "relevance", cadena } = await searchParams;
  const inStoreOnly = tienda === "1";
  const onlyOffers = ofertas === "1";
  const sortVal = (SORTS.find((s) => s.value === sort)?.value ?? "relevance") as Sort;

  const chains = await getChainsWithProducts();

  // Smart search: una sola llamada que maneja los 3 niveles internamente
  let results: Awaited<ReturnType<typeof searchProducts>> = [];
  let aiUsed = false;

  if (q.trim()) {
    // smartSearch internamente hace búsqueda directa primero (0 tokens si ≥4 resultados)
    // y sólo activa IA si los resultados son insuficientes.
    const [directCount, aiResults] = await Promise.all([
      searchProducts(q, { limit: 1, inStoreOnly }).then((r) => r.length),
      smartSearch(q, { limit: 80, inStoreOnly }).catch(() =>
        searchProducts(q, { limit: 80, inStoreOnly }),
      ),
    ]);

    // Aplicar filtros de sort y cadena encima del resultado
    let sorted = cadena ? aiResults.filter((r) => r.chainSlug === cadena) : aiResults;
    if (sortVal === "price_asc") sorted = sorted.sort((a, b) => a.price - b.price);
    else if (sortVal === "price_desc") sorted = sorted.sort((a, b) => b.price - a.price);
    else if (sortVal === "discount") sorted = sorted.sort((a, b) => (b.ahorroPct ?? 0) - (a.ahorroPct ?? 0));

    // Dedup: fusionar el mismo producto de distintas cadenas en una sola card
    results = dedupResults(sorted);
    // Mostrar badge IA sólo cuando la IA encontró más resultados que la búsqueda directa
    aiUsed = directCount < 4 && results.length > directCount;
  }

  if (onlyOffers) results = results.filter((r) => r.isOnSale);

  const offers = results.filter((r) => r.isOnSale).length;
  const inStore = results.filter((r) => !r.isOnlineOnly).length;

  return (
    <main className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="sticky top-[57px] z-10 -mx-4 bg-[var(--background)] px-4 pb-3 pt-1 sm:top-[65px] sm:mx-0 sm:px-0">
        <SearchInput defaultValue={q} size="md" />

        {/* Filter chips */}
        {q.trim() && results.length > 0 && (
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
            <FilterChip
              href={chipHref(q, { tienda, ofertas, sort, cadena })}
              active={!inStoreOnly && !onlyOffers}
              label={`Todo · ${results.length}`}
            />
            <FilterChip
              href={chipHref(q, { tienda, ofertas: ofertas ? undefined : "1", sort, cadena })}
              active={onlyOffers}
              label={`🏷️ Ofertas · ${offers}`}
            />
            <FilterChip
              href={chipHref(q, { tienda: tienda ? undefined : "1", ofertas, sort, cadena })}
              active={inStoreOnly}
              label={`🏪 En tienda · ${inStore}`}
            />
          </div>
        )}

        {/* Chain filter chips */}
        {q.trim() && chains.length > 0 && (
          <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
            <FilterChip
              href={chipHref(q, { tienda, ofertas, sort })}
              active={!cadena}
              label="Todas las cadenas"
              variant="chain"
            />
            {chains.map((c) => (
              <FilterChip
                key={c.slug}
                href={chipHref(q, { tienda, ofertas, sort, cadena: cadena === c.slug ? undefined : c.slug })}
                active={cadena === c.slug}
                label={c.name}
                variant="chain"
              />
            ))}
          </div>
        )}

        {/* Sort pills */}
        {q.trim() && results.length > 0 && (
          <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
            {SORTS.map((s) => (
              <FilterChip
                key={s.value}
                href={chipHref(q, { tienda, ofertas, sort: s.value, cadena })}
                active={sortVal === s.value}
                label={s.label}
                variant="sort"
              />
            ))}
          </div>
        )}

        {/* AI indicator */}
        {aiUsed && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
            ✨ Búsqueda mejorada con IA
          </div>
        )}
      </div>

      {!q.trim() && (
        <div className="mt-12 text-center text-neutral-500">
          <div className="text-5xl">🔍</div>
          <p className="mt-3 text-base">¿Qué quieres comparar hoy?</p>
          <p className="mt-1 text-sm">Escribe el nombre de un producto arriba.</p>
        </div>
      )}

      {q.trim() && results.length === 0 && (
        <div className="mt-12 rounded-2xl bg-white p-10 text-center ring-1 ring-neutral-200">
          <div className="text-5xl">🤔</div>
          <p className="mt-3 font-medium">Sin resultados para "{q}"</p>
          <p className="mt-1 text-sm text-neutral-500">
            Por ahora cubrimos Jumbo, Santa Isabel y Tottus. Más cadenas próximamente.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white"
          >
            Volver al inicio
          </Link>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} variant="grid" />
          ))}
        </div>
      )}
    </main>
  );
}

function chipHref(q: string, params: { tienda?: string; ofertas?: string; sort?: string; cadena?: string }) {
  const u = new URLSearchParams({ q });
  if (params.tienda) u.set("tienda", params.tienda);
  if (params.ofertas) u.set("ofertas", params.ofertas);
  if (params.sort && params.sort !== "relevance") u.set("sort", params.sort);
  if (params.cadena) u.set("cadena", params.cadena);
  return `/buscar?${u.toString()}`;
}

function FilterChip({
  href,
  active,
  label,
  variant = "default",
}: {
  href: string;
  active: boolean;
  label: string;
  variant?: "default" | "chain" | "sort";
}) {
  const base = "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition";
  const activeClass =
    variant === "sort"
      ? "bg-neutral-900 text-white shadow"
      : variant === "chain"
        ? "bg-neutral-800 text-white shadow"
        : "bg-emerald-600 text-white shadow";
  const inactiveClass = "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:ring-neutral-300";
  return (
    <Link href={href} className={`${base} ${active ? activeClass : inactiveClass}`}>
      {label}
    </Link>
  );
}
