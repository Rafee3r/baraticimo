import Link from "next/link";
import { searchProducts } from "../../lib/queries";
import { smartSearch } from "../../lib/ai-search";
import { SearchInput } from "../../components/SearchInput";
import { ProductCard } from "../../components/ProductCard";

export const revalidate = 120;

interface Props {
  searchParams: Promise<{ q?: string; tienda?: string; ofertas?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", tienda, ofertas } = await searchParams;
  const inStoreOnly = tienda === "1";
  const onlyOffers = ofertas === "1";
  let results = q.trim()
    ? await smartSearch(q, { limit: 80, inStoreOnly }).catch(() =>
        searchProducts(q, { limit: 80, inStoreOnly }),
      )
    : [];
  if (onlyOffers) results = results.filter((r) => r.isOnSale);

  // Group helpers
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
              href={chipHref(q, { tienda, ofertas })}
              active={!inStoreOnly && !onlyOffers}
              label={`Todo · ${results.length}`}
            />
            <FilterChip
              href={chipHref(q, { tienda, ofertas: ofertas ? undefined : "1" })}
              active={onlyOffers}
              label={`🏷️ Ofertas · ${offers}`}
            />
            <FilterChip
              href={chipHref(q, { tienda: tienda ? undefined : "1", ofertas })}
              active={inStoreOnly}
              label={`🏪 En tienda · ${inStore}`}
            />
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
          <p className="mt-3 font-medium">Sin resultados para “{q}”</p>
          <p className="mt-1 text-sm text-neutral-500">
            Por ahora cubrimos Jumbo y Santa Isabel. Más cadenas próximamente.
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

function chipHref(q: string, params: { tienda?: string; ofertas?: string }) {
  const u = new URLSearchParams({ q });
  if (params.tienda) u.set("tienda", params.tienda);
  if (params.ofertas) u.set("ofertas", params.ofertas);
  return `/buscar?${u.toString()}`;
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-emerald-600 text-white shadow"
          : "bg-white text-neutral-700 ring-1 ring-neutral-200 hover:ring-neutral-300"
      }`}
    >
      {label}
    </Link>
  );
}
