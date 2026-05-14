import Link from "next/link";
import { getFeaturedProducts, getStats } from "../lib/queries";
import { SearchInput } from "../components/SearchInput";
import { CategoryRow } from "../components/CategoryRow";
import { ProductCard } from "../components/ProductCard";

export const revalidate = 300;

export default async function HomePage() {
  const [deals, stats] = await Promise.all([
    getFeaturedProducts(10),
    getStats(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-8">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg sm:p-10">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Compara y ahorra
        </h1>
        <p className="mt-2 text-sm text-emerald-50 sm:text-base">
          {stats.productCount.toLocaleString("es-CL")} productos · {stats.saleCount}{" "}
          en oferta hoy
        </p>
        <div className="mt-5">
          <SearchInput size="lg" />
        </div>
      </section>

      {/* Categorías */}
      <section className="mt-6 sm:mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Explorar
        </h2>
        <CategoryRow />
      </section>

      {/* Ofertas */}
      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl font-bold sm:text-2xl">🔥 Ofertas hoy</h2>
          <Link
            href="/buscar"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        {deals.length === 0 ? (
          <p className="rounded-2xl bg-neutral-100 p-6 text-center text-sm text-neutral-500">
            Aún no hay ofertas cargadas hoy.
          </p>
        ) : (
          <>
            {/* Mobile: horizontal scroll carousel */}
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 no-scrollbar sm:hidden">
              {deals.map((p) => (
                <div key={p.id} className="w-40 shrink-0">
                  <ProductCard product={p} variant="grid" />
                </div>
              ))}
            </div>
            {/* Desktop: grid */}
            <div className="hidden grid-cols-2 gap-3 sm:grid sm:grid-cols-4 lg:grid-cols-5">
              {deals.map((p) => (
                <ProductCard key={p.id} product={p} variant="grid" />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Cadenas */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Cadenas
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "Jumbo", color: "#00873A", kind: "Super" },
            { name: "Santa Isabel", color: "#E60028", kind: "Super" },
            { name: "Líder", color: "#0071CE", kind: "Super", soon: true },
            { name: "Tottus", color: "#FFB81C", kind: "Super", soon: true },
            { name: "Unimarc", color: "#003DA5", kind: "Super", soon: true },
            { name: "Cruz Verde", color: "#00A651", kind: "Farma", soon: true },
            { name: "Salcobrand", color: "#005DAA", kind: "Farma", soon: true },
            { name: "Ahumada", color: "#E4002B", kind: "Farma", soon: true },
          ].map((c) => (
            <div
              key={c.name}
              className={`flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm ring-1 ${
                c.soon ? "text-neutral-400 ring-neutral-200" : "ring-neutral-300"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: c.color, opacity: c.soon ? 0.5 : 1 }}
              />
              {c.name}
              {c.soon && (
                <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                  pronto
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer disclaimer */}
      <p className="mt-8 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">
        <strong>Importante:</strong> Mostramos los precios de los sitios web. En
        tienda física pueden ser distintos. Los productos marcados{" "}
        <span className="rounded-full bg-sky-100 px-1.5 py-0.5 font-medium text-sky-700">
          💻 online
        </span>{" "}
        no están disponibles en sucursal.
      </p>
    </main>
  );
}
