import Link from "next/link";
import { searchProducts } from "../../lib/queries";

export const revalidate = 120;

interface Props {
  searchParams: Promise<{ q?: string; tienda?: string }>;
}

function formatCLP(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", tienda } = await searchParams;
  const inStoreOnly = tienda === "1";
  const results = q.trim()
    ? await searchProducts(q, { limit: 50, inStoreOnly })
    : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <form action="/buscar" className="space-y-3">
        <div className="flex gap-2">
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
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            name="tienda"
            value="1"
            defaultChecked={inStoreOnly}
            className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>
            Solo productos <strong>disponibles en tienda física</strong> (excluir "Solo online")
          </span>
        </label>
      </form>

      <div className="mt-6">
        {q.trim() ? (
          <p className="text-sm text-neutral-500">
            <span className="font-medium text-neutral-900">{results.length}</span>{" "}
            resultado{results.length === 1 ? "" : "s"} para “
            <span className="font-medium text-neutral-900">{q}</span>”
          </p>
        ) : (
          <p className="text-sm text-neutral-500">
            Escribe el nombre de un producto o marca para buscar.
          </p>
        )}
      </div>

      {q.trim() && results.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center">
          <div className="text-4xl">🔍</div>
          <p className="mt-3 text-neutral-600">
            No encontramos productos para “{q}”.
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Por ahora sólo tenemos catálogo de Jumbo. Más cadenas próximamente.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <ul className="mt-6 space-y-3">
          {results.map((p) => (
            <li key={p.id}>
              <Link
                href={`/producto/${p.id}`}
                className="flex gap-4 rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-900"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-2xl">🛒</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-500">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: p.chainColor }}
                    />
                    {p.chainName}
                    {p.brand && <span> · {p.brand}</span>}
                  </div>
                  {p.isOnlineOnly && (
                    <div className="mt-1 inline-block rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                      💻 Solo online
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-emerald-600">
                    {formatCLP(p.price)}
                  </div>
                  {p.listPrice && (
                    <div className="text-xs text-neutral-400 line-through">
                      {formatCLP(p.listPrice)}
                    </div>
                  )}
                  {p.ahorroPct && (
                    <div className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      −{p.ahorroPct}%
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
