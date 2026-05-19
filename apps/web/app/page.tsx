import Link from "next/link";
import {
  getFeaturedProducts,
  getOffersByCategory,
  getStats,
  getTopCrossChainDeals,
} from "../lib/queries";
import { SearchInput } from "../components/SearchInput";
import { CategoryRow } from "../components/CategoryRow";
import { ProductCard } from "../components/ProductCard";
import { ComparisonCard } from "../components/ComparisonCard";

export const revalidate = 300;

export default async function HomePage() {
  const [stats, topDeals, crossChainDeals, lacteos, carnes, frutasVerduras, farmacia] =
    await Promise.all([
      getStats(),
      getFeaturedProducts(10),
      getTopCrossChainDeals(4).catch(() => []),
      getOffersByCategory("lacteos", 8),
      getOffersByCategory("carnes", 8),
      getOffersByCategory("frutas-verduras", 8),
      getOffersByCategory("farmacia", 8),
    ]);

  return (
    <main className="mx-auto max-w-5xl px-4 pt-3 sm:px-6 sm:pt-5">
      {/* Hero compacto — solo lo esencial */}
      <section className="rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 p-4 shadow-md sm:p-5">
        <p className="text-xs font-medium text-emerald-200">
          {stats.productCount.toLocaleString("es-CL")} productos ·{" "}
          <span className="text-white">{stats.saleCount.toLocaleString("es-CL")} en oferta</span>
        </p>
        <h1 className="mt-1 text-lg font-bold text-white sm:text-xl">
          Compara y ahorra en tu compra
        </h1>
        <div className="mt-3">
          <SearchInput size="md" />
        </div>
      </section>

      {/* Categorías como pills */}
      <section className="mt-4">
        <CategoryRow />
      </section>

      {/* Comparativas cross-chain */}
      {crossChainDeals.length > 0 && (
        <section className="mt-6">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="text-base font-bold sm:text-lg">💰 Mismo producto, distinto precio</h2>
            <Link href="/comparar" className="text-sm font-medium text-emerald-600 hover:underline">
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

      {/* Top ofertas hoy */}
      <SectionRow title="🔥 Top ofertas" link="/buscar?ofertas=1" products={topDeals} />

      {/* Categorías de productos clasificados por IA — NO matching por texto */}
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
        <Link href={link} className="text-sm font-medium text-emerald-600 hover:underline">
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
