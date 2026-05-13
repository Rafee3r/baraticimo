import Link from "next/link";
import { searchProducts, formatCLP, getChain, PRODUCTS } from "../../lib/mock-data";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? searchProducts(q) : PRODUCTS;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <form action="/buscar" className="flex gap-2">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar producto..."
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 shadow-sm focus:border-neutral-900 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
        >
          Buscar
        </button>
      </form>

      <div className="mt-6">
        <p className="text-sm text-neutral-500">
          {q.trim() ? (
            <>
              <span className="font-medium text-neutral-900">{results.length}</span>{" "}
              resultado{results.length === 1 ? "" : "s"} para “
              <span className="font-medium text-neutral-900">{q}</span>”
            </>
          ) : (
            <>Mostrando todos los productos disponibles</>
          )}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center">
          <div className="text-4xl">🔍</div>
          <p className="mt-3 text-neutral-600">
            No encontramos productos para “{q}”.
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Prueba con términos más generales como “leche” o “coca cola”.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {results.map((p) => {
            const min = p.prices.reduce((m, c) => (c.price < m.price ? c : m));
            const max = p.prices.reduce((m, c) => (c.price > m.price ? c : m));
            const minChain = getChain(min.chainSlug)!;
            const ahorro = max.price - min.price;
            return (
              <li key={p.id}>
                <Link
                  href={`/producto/${p.id}`}
                  className="flex gap-4 rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-900"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-3xl">
                    {p.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{p.name}</div>
                    <div className="mt-0.5 text-sm text-neutral-500">
                      {p.brand} · {p.category}
                    </div>
                    <div className="mt-2 text-xs text-neutral-500">
                      Disponible en {p.prices.length} cadena
                      {p.prices.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-neutral-500">Desde</div>
                    <div className="text-xl font-bold text-emerald-600">
                      {formatCLP(min.price)}
                    </div>
                    <div className="text-xs text-neutral-500">en {minChain.name}</div>
                    {ahorro > 0 && (
                      <div className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        −{formatCLP(ahorro)}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
