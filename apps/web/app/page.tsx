import Link from "next/link";
import { getFeaturedProducts, getStats } from "../lib/queries";

export const revalidate = 300; // re-render cada 5 min para reflejar nuevos scrapes

const CHAINS = [
  { slug: "jumbo", name: "Jumbo", kind: "Supermercado", color: "#00873A" },
  { slug: "lider", name: "Líder", kind: "Supermercado", color: "#0071CE" },
  { slug: "santa-isabel", name: "Santa Isabel", kind: "Supermercado", color: "#E60028" },
  { slug: "tottus", name: "Tottus", kind: "Supermercado", color: "#FFB81C" },
  { slug: "unimarc", name: "Unimarc", kind: "Supermercado", color: "#003DA5" },
  { slug: "cruz-verde", name: "Cruz Verde", kind: "Farmacia", color: "#00A651" },
  { slug: "salcobrand", name: "Salcobrand", kind: "Farmacia", color: "#005DAA" },
  { slug: "ahumada", name: "Ahumada", kind: "Farmacia", color: "#E4002B" },
];

function formatCLP(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

export default async function HomePage() {
  const [featured, stats] = await Promise.all([
    getFeaturedProducts(12),
    getStats(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Compara precios y ahorra en tu compra
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          Encuentra el supermercado o farmacia más barato para tus productos
          favoritos. Precios actualizados a diario en todo Chile.
        </p>

        <form action="/buscar" className="mx-auto mt-8 flex max-w-xl gap-2">
          <input
            name="q"
            type="search"
            placeholder="Ej: leche, detergente, pañales..."
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base shadow-sm focus:border-neutral-900 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
          >
            Buscar
          </button>
        </form>

        <p className="mt-4 text-sm text-neutral-500">
          Prueba:
          {["leche", "detergente", "pañales", "café"].map((q) => (
            <Link
              key={q}
              href={`/buscar?q=${encodeURIComponent(q)}`}
              className="ml-2 underline hover:text-neutral-900"
            >
              {q}
            </Link>
          ))}
        </p>

        {stats.productCount > 0 && (
          <p className="mt-6 text-sm text-neutral-500">
            <span className="font-medium text-neutral-900">
              {stats.productCount.toLocaleString("es-CL")}
            </span>{" "}
            productos · <span className="font-medium text-emerald-700">
              {stats.saleCount}
            </span>{" "}
            en oferta hoy
          </p>
        )}
      </section>

      <section className="mt-16">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Cadenas comparadas
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {CHAINS.map((c) => (
            <div
              key={c.slug}
              className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2"
            >
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: c.color }}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{c.name}</div>
                <div className="text-xs text-neutral-500">{c.kind}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">🔥 Mejores ofertas hoy</h2>
          <Link href="/buscar" className="text-sm text-neutral-500 hover:underline">
            Ver todos
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Aún no hay ofertas cargadas. El scraper corre cada noche a las 3 AM.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/producto/${p.id}`}
                  className="flex h-full gap-3 rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-900"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-2xl">🛒</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: p.chainColor }}
                      />
                      <span className="text-neutral-500">{p.chainName}</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCLP(p.price)}
                      </span>
                      {p.listPrice && (
                        <span className="text-xs text-neutral-400 line-through">
                          {formatCLP(p.listPrice)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.ahorroPct && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          −{p.ahorroPct}%
                        </span>
                      )}
                      {p.isOnlineOnly && (
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                          💻 Solo online
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-20 space-y-2 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-500">
        <p>
          Datos actualizados a diario desde los sitios oficiales de cada cadena.
        </p>
        <p>
          <strong className="text-neutral-700">Precios web</strong> — los precios en tienda física
          pueden diferir. Los productos marcados{" "}
          <span className="rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
            💻 Solo online
          </span>{" "}
          no están disponibles para compra en tienda.
        </p>
      </footer>
    </main>
  );
}
