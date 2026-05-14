import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductDetail } from "../../../lib/queries";

export const revalidate = 120;

interface Props {
  params: Promise<{ id: string }>;
}

function formatCLP(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const data = await getProductDetail(id);
  if (!data) return notFound();
  const { row: p, history } = data;

  const minHist = Math.min(...history.map((h) => h.price));
  const maxHist = Math.max(...history.map((h) => h.price));
  const hasHistory = history.length > 1;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/buscar" className="text-sm text-neutral-500 hover:underline">
        ← Volver a buscar
      </Link>

      <div className="mt-4 flex gap-5 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain" />
          ) : (
            <span className="text-5xl">🛒</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.chainColor }}
            />
            <span>{p.chainName}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold">{p.name}</h1>
          {p.brand && (
            <div className="mt-1 text-sm text-neutral-600">{p.brand}</div>
          )}
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          {p.isOnSale ? "🏷️ En oferta" : "Precio actual"}
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <div className="text-3xl font-bold text-emerald-700">
            {formatCLP(p.price)}
          </div>
          {p.listPrice && (
            <div className="text-base font-medium text-neutral-500 line-through">
              {formatCLP(p.listPrice)}
            </div>
          )}
        </div>
        {p.ahorroPct && p.ahorro && (
          <div className="mt-2 text-sm text-emerald-800">
            Ahorras <strong>{formatCLP(p.ahorro)}</strong> ({p.ahorroPct}%)
          </div>
        )}
        <div className="mt-3 text-xs text-neutral-500">
          Actualizado: {formatDate(p.scrapedAt)}
        </div>
        <a
          href={p.url.startsWith("http") ? p.url : `https://www.jumbo.cl${p.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Ver en {p.chainName} →
        </a>
      </section>

      {hasHistory && (
        <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Historial de precio</h2>
          <p className="mt-1 text-xs text-neutral-500">
            {history.length} mediciones · mínimo {formatCLP(minHist)} · máximo{" "}
            {formatCLP(maxHist)}
          </p>
          <ul className="mt-4 space-y-1.5 text-sm">
            {history.slice(-10).reverse().map((h, i) => (
              <li
                key={i}
                className="flex items-center justify-between border-b border-neutral-100 pb-1.5 last:border-0"
              >
                <span className="text-neutral-500">{formatDate(h.at)}</span>
                <span className="font-mono font-medium">{formatCLP(h.price)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-5">
        <h2 className="text-sm font-medium text-neutral-700">
          Comparación con otras cadenas
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Aún no tenemos el matcher activo, así que sólo mostramos el precio en{" "}
          {p.chainName}. Cuando agreguemos Líder, Santa Isabel, etc., y conectemos
          el matcher IA, esta sección va a mostrar el precio en cada cadena.
        </p>
      </section>
    </main>
  );
}
