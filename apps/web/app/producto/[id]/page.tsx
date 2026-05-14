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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "hace pocos minutos";
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const data = await getProductDetail(id);
  if (!data) return notFound();
  const { row: p, history } = data;

  const minHist = history.length > 0 ? Math.min(...history.map((h) => h.price)) : p.price;
  const maxHist = history.length > 0 ? Math.max(...history.map((h) => h.price)) : p.price;
  const span = maxHist - minHist || 1;
  const externalHref = p.url.startsWith("http")
    ? p.url
    : `https://www.${p.chainSlug === "santa-isabel" ? "santaisabel" : p.chainSlug}.cl${p.url}`;

  return (
    <main className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 sm:pt-6">
      <Link
        href="/buscar"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:underline"
      >
        ← Atrás
      </Link>

      {/* Producto: foto grande */}
      <div className="mt-3 overflow-hidden rounded-3xl bg-white ring-1 ring-neutral-200">
        <div className="relative aspect-square w-full bg-neutral-50">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.imageUrl}
              alt={p.name}
              className="h-full w-full object-contain p-4"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl">
              🛒
            </div>
          )}
          {p.ahorroPct && (
            <span className="absolute left-4 top-4 rounded-xl bg-red-500 px-3 py-1.5 text-base font-bold text-white shadow-lg">
              −{p.ahorroPct}%
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.chainColor }}
          />
          <span className="font-medium">{p.chainName}</span>
          {p.brand && <span>· {p.brand}</span>}
        </div>
        <h1 className="mt-1 text-2xl font-bold leading-tight">{p.name}</h1>
        {p.isOnlineOnly && (
          <p className="mt-2 inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
            💻 Solo online — no disponible en tienda física
          </p>
        )}
      </div>

      {/* Precio destacado */}
      <div className="mt-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
          {p.isOnSale ? "🏷️ En oferta" : "Precio hoy"}
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <div className="text-4xl font-bold">{formatCLP(p.price)}</div>
          {p.listPrice && (
            <div className="text-base font-medium text-emerald-200 line-through">
              {formatCLP(p.listPrice)}
            </div>
          )}
        </div>
        {p.ahorro && (
          <div className="mt-1 text-sm text-emerald-50">
            Ahorras <strong>{formatCLP(p.ahorro)}</strong>
          </div>
        )}
        <div className="mt-3 text-xs text-emerald-100">
          Actualizado {timeAgo(p.scrapedAt)}
        </div>
      </div>

      {/* Comparativa entre cadenas (placeholder hasta tener el matcher) */}
      <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-900">
          ¿Más barato en otra cadena?
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Pronto activaremos la comparación entre cadenas. Por ahora solo
          mostramos el precio en <strong>{p.chainName}</strong>.
        </p>
      </div>

      {/* Historial visual */}
      {history.length > 1 && (
        <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-neutral-200">
          <h2 className="text-sm font-semibold">📈 Historial de precio</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Mín {formatCLP(minHist)} · Máx {formatCLP(maxHist)} · {history.length}{" "}
            mediciones
          </p>
          <div className="mt-3 flex h-24 items-end gap-1">
            {history.slice(-30).map((h, i) => {
              const heightPct = ((h.price - minHist) / span) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-emerald-200 transition hover:bg-emerald-400"
                  style={{ height: `${20 + heightPct * 0.8}%` }}
                  title={`${formatCLP(h.price)} · ${new Date(h.at).toLocaleDateString("es-CL")}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {!p.isOnlineOnly && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">
          ⚠ Este es el <strong>precio web</strong>. El precio en tienda física puede
          diferir.
        </p>
      )}

      {/* CTA */}
      <div className="sticky bottom-20 mt-6 md:bottom-4">
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl bg-emerald-600 px-5 py-4 text-center font-semibold text-white shadow-lg transition active:scale-[0.98] hover:bg-emerald-700"
        >
          Ver en {p.chainName} →
        </a>
      </div>
    </main>
  );
}
