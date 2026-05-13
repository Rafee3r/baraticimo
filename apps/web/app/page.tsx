import Link from "next/link";
import { CHAINS, PRODUCTS, formatCLP, getChain } from "../lib/mock-data";

function cheapest(p: (typeof PRODUCTS)[number]) {
  return p.prices.reduce((min, cur) => (cur.price < min.price ? cur : min));
}

function mostExpensive(p: (typeof PRODUCTS)[number]) {
  return p.prices.reduce((max, cur) => (cur.price > max.price ? cur : max));
}

export default function HomePage() {
  const featured = PRODUCTS.slice(0, 6);

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
            placeholder="Ej: coca cola, paracetamol, pañales..."
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
          {["coca cola", "leche", "paracetamol", "pañales"].map((q) => (
            <Link
              key={q}
              href={`/buscar?q=${encodeURIComponent(q)}`}
              className="ml-2 underline hover:text-neutral-900"
            >
              {q}
            </Link>
          ))}
        </p>
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
          <h2 className="text-xl font-semibold">Productos populares</h2>
          <Link href="/buscar?q=" className="text-sm text-neutral-500 hover:underline">
            Ver todos
          </Link>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => {
            const min = cheapest(p);
            const max = mostExpensive(p);
            const minChain = getChain(min.chainSlug)!;
            const ahorro = max.price - min.price;
            return (
              <li key={p.id}>
                <Link
                  href={`/producto/${p.id}`}
                  className="flex h-full gap-3 rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-900"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-3xl">
                    {p.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
                    <div className="mt-1 text-xs text-neutral-500">{p.brand}</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCLP(min.price)}
                      </span>
                      <span className="text-xs text-neutral-500">en {minChain.name}</span>
                    </div>
                    {ahorro > 0 && (
                      <div className="mt-1 text-xs text-neutral-400">
                        Ahorra hasta {formatCLP(ahorro)} vs. el más caro
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="mt-20 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-500">
        Demo con datos de ejemplo · Los precios reales se actualizan diariamente
      </footer>
    </main>
  );
}
