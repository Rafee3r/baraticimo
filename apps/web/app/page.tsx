import Link from "next/link";
import {
  getFeaturedProducts,
  getOffersByCategory,
  getTopCrossChainDeals,
  getStats,
} from "../lib/queries";
import { SearchInput } from "../components/SearchInput";
import { CategoryRow } from "../components/CategoryRow";
import { ProductCard } from "../components/ProductCard";
import { ComparisonCard } from "../components/ComparisonCard";

export const revalidate = 300;

export default async function HomePage() {
  const [topDeals, crossChainDeals, lacteos, carnes, frutasVerduras, farmacia, stats] =
    await Promise.all([
      getFeaturedProducts(10),
      getTopCrossChainDeals(4).catch(() => []),
      getOffersByCategory("lacteos", 8),
      getOffersByCategory("carnes", 8),
      getOffersByCategory("frutas-verduras", 8),
      getOffersByCategory("farmacia", 8),
      getStats().catch(() => null),
    ]);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
      {/* ── HERO: buscador central ── */}
      <section className="relative -mx-4 overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 px-4 pb-8 pt-8 sm:-mx-6 sm:px-6 sm:pb-10 sm:pt-10">
        {/* Glow decorativo */}
        <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-lime-500/10 blur-3xl" />

        {/* Tagline */}
        <div className="mb-5 text-center">
          <span className="inline-block rounded-full bg-lime-500/15 px-3 py-1 text-xs font-semibold text-lime-400 ring-1 ring-lime-500/30">
            🛒 Compara precios en 7 cadenas
          </span>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
            ¿Dónde conviene comprar hoy?
          </h1>
          <p className="mt-1.5 text-sm text-neutral-400 sm:text-base">
            Busca un producto y ve el precio en cada supermercado y farmacia
          </p>
        </div>

        {/* Buscador grande */}
        <div className="mx-auto max-w-xl">
          <SearchInput size="lg" />
        </div>

        {/* Stats rápidas */}
        {stats && (
          <div className="mt-5 flex justify-center gap-6 text-center">
            <div>
              <p className="text-lg font-bold text-white">{stats.productCount.toLocaleString("es-CL")}</p>
              <p className="text-[11px] text-neutral-500">productos</p>
            </div>
            <div className="w-px bg-neutral-700" />
            <div>
              <p className="text-lg font-bold text-lime-400">{stats.saleCount.toLocaleString("es-CL")}</p>
              <p className="text-[11px] text-neutral-500">en oferta ahora</p>
            </div>
            <div className="w-px bg-neutral-700" />
            <div>
              <p className="text-lg font-bold text-white">7</p>
              <p className="text-[11px] text-neutral-500">cadenas</p>
            </div>
          </div>
        )}
      </section>

      {/* Categorías */}
      <section className="mt-4">
        <CategoryRow />
      </section>

      {/* Top ofertas */}
      {topDeals.length > 0 && (
        <SectionRow title="🔥 Top ofertas" link="/buscar?ofertas=1" products={topDeals} />
      )}

      {/* Comparativas cross-chain */}
      {crossChainDeals.length > 0 && (
        <section className="mt-6">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="text-base font-bold sm:text-lg">💰 Mismo producto, distinto precio</h2>
            <Link href="/comparar" className="text-sm font-medium text-lime-600 hover:underline">
              Ver más →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {crossChainDeals.map((deal) => (
              <ComparisonCard key={`${deal.cheaper.id}-${deal.pricier.id}`} deal={deal} />
            ))}
          </div>
        </section>
      )}

      {/* Categorías de productos */}
      <SectionRow title="🥛 Lácteos" link="/buscar?cat=lacteos" products={lacteos} />
      <SectionRow title="🥩 Carnes" link="/buscar?cat=carnes" products={carnes} />
      <SectionRow title="🥬 Frutas y verduras" link="/buscar?cat=frutas-verduras" products={frutasVerduras} />
      <SectionRow title="💊 Farmacia" link="/buscar?cat=farmacia" products={farmacia} />
    </main>
  );
}

function SectionRow({
  title,
  link,
  products,
}: {
  title: string;
  link: string;
  products: Awaited<ReturnType<typeof getFeaturedProducts>>;
}) {
  if (products.length === 0) return null;
  return (
    <section className="mt-6">
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="text-base font-bold sm:text-lg">{title}</h2>
        <Link href={link} className="text-sm font-medium text-lime-600 hover:underline">
          Ver más →
        </Link>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:px-0">
        {products.map((p) => (
          <div key={p.id} className="w-32 shrink-0 sm:w-40">
            <ProductCard product={p} variant="compact" />
          </div>
        ))}
      </div>
    </section>
  );
}
