import Link from "next/link";
import {
  getFeaturedProducts,
  getOffersByKeyword,
  getStats,
  getTopCrossChainDeals,
} from "../lib/queries";
import { SearchInput } from "../components/SearchInput";
import { CategoryRow } from "../components/CategoryRow";
import { ProductCard } from "../components/ProductCard";
import { ComparisonCard } from "../components/ComparisonCard";

export const revalidate = 300;

export default async function HomePage() {
  const [topDeals, stats, crossChainDeals, lacteos, despensa, bebidas, snacks, limpieza, mascotas] =
    await Promise.all([
      getFeaturedProducts(10),
      getStats(),
      getTopCrossChainDeals(4).catch(() => []),
      getOffersByKeyword("leche", 8),
      getOffersByKeyword("arroz", 8),
      getOffersByKeyword("bebida", 8),
      getOffersByKeyword("snack", 8),
      getOffersByKeyword("detergente", 8),
      getOffersByKeyword("mascota", 8),
    ]);

  return (
    <main className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6">
      {/* Hero — dark */}
      <section className="rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 text-white shadow-lg sm:p-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/20">
          ✨ v4.0
        </div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          Compara y arma tu lista
        </h1>
        <p className="mt-1 text-sm text-neutral-300">
          {stats.productCount.toLocaleString("es-CL")} productos ·{" "}
          <span className="font-semibold text-emerald-400">{stats.saleCount.toLocaleString("es-CL")} en oferta</span>
        </p>
        <div className="mt-4">
          <SearchInput size="lg" />
        </div>
      </section>

      {/* Categorías */}
      <section className="mt-6">
        <CategoryRow />
      </section>

      {/* Comparativas entre cadenas */}
      {crossChainDeals.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">💰 Mismo producto, distinto precio</h2>
              <p className="text-xs text-neutral-500">Lo que cambia de cadena puede ahorrarte</p>
            </div>
            <Link
              href="/comparar"
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
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

      {/* Top ofertas */}
      <SectionRow title="🔥 Top ofertas hoy" link="/buscar" products={topDeals} />

      {/* Lácteos */}
      <SectionRow
        title="🥛 Lácteos"
        link="/buscar?q=leche"
        products={lacteos}
      />

      {/* Despensa */}
      <SectionRow
        title="🛒 Despensa"
        link="/buscar?q=arroz"
        products={despensa}
      />

      {/* Bebidas */}
      <SectionRow
        title="🥤 Bebidas"
        link="/buscar?q=bebida"
        products={bebidas}
      />

      {/* Snacks */}
      <SectionRow
        title="🍿 Snacks y dulces"
        link="/buscar?q=snack"
        products={snacks}
      />

      {/* Limpieza */}
      <SectionRow
        title="🧴 Limpieza"
        link="/buscar?q=detergente"
        products={limpieza}
      />

      {/* Mascotas */}
      <SectionRow
        title="🐾 Mascotas"
        link="/buscar?q=mascota"
        products={mascotas}
      />

      {/* Cómo funciona */}
      <section className="mt-10 rounded-3xl bg-white p-5 ring-1 ring-neutral-200">
        <h2 className="text-base font-bold">¿Cómo funciona?</h2>
        <ol className="mt-3 space-y-2.5 text-sm text-neutral-700">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              1
            </span>
            <span>
              <strong>Busca</strong> los productos que sueles comprar (ej: leche, pañales)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              2
            </span>
            <span>
              <strong>Agrégalos a tu lista</strong> con el botón "🛒 Agregar a mi lista"
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              3
            </span>
            <span>
              <strong>Mira el total</strong> en cada cadena, y compra donde sea más barato
            </span>
          </li>
        </ol>
      </section>

      {/* Footer disclaimer */}
      <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">
        <strong>Importante:</strong> los precios son de los sitios web. En tienda
        física pueden diferir.
      </p>
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
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        <Link
          href={link}
          className="text-sm font-medium text-emerald-600 hover:underline"
        >
          Ver más →
        </Link>
      </div>
      {/* Horizontal scroll en todos los tamaños — patrón de app */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:px-0">
        {products.map((p) => (
          <div key={p.id} className="w-36 shrink-0 sm:w-44">
            <ProductCard product={p} variant="compact" />
          </div>
        ))}
      </div>
    </section>
  );
}
