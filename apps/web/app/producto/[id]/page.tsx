import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCrossChainMatches,
  getProductDetail,
} from "../../../lib/queries";
import { FavoriteButton } from "../../../components/FavoriteButton";
import { AddToListButton } from "../../../components/AddToListButton";

export const revalidate = 120;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getProductDetail(id);
  if (!data) return { title: "Producto no encontrado" };
  const { row: p } = data;

  const price = `$${p.price.toLocaleString("es-CL")}`;
  const title = `${p.name} — ${price} en ${p.chainName}`;
  const description = `Compara el precio de ${p.name} en supermercados de Chile. Hoy en ${p.chainName}: ${price}${p.ahorro ? `, ahorra $${p.ahorro.toLocaleString("es-CL")}` : ""}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(p.imageUrl ? { images: [{ url: p.imageUrl, width: 400, height: 400, alt: p.name }] } : {}),
    },
    alternates: {
      canonical: `/producto/${id}`,
    },
  };
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

const CHAIN_DOMAINS: Record<string, string> = {
  jumbo: "www.jumbo.cl",
  "santa-isabel": "www.santaisabel.cl",
  lider: "www.lider.cl",
  tottus: "www.tottus.cl",
  unimarc: "www.unimarc.cl",
  acuenta: "www.acuenta.cl",
  "cruz-verde": "www.cruzverde.cl",
  salcobrand: "www.salcobrand.cl",
  ahumada: "www.ahumada.cl",
};

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const data = await getProductDetail(id);
  if (!data) return notFound();
  const { row: p, history } = data;

  const matches = await getCrossChainMatches(id, 4);

  const minHist = history.length > 0 ? Math.min(...history.map((h) => h.price)) : p.price;
  const maxHist = history.length > 0 ? Math.max(...history.map((h) => h.price)) : p.price;
  const span = maxHist - minHist || 1;

  const domain = CHAIN_DOMAINS[p.chainSlug] ?? "www.jumbo.cl";
  const externalHref = p.url.startsWith("http") ? p.url : `https://${domain}${p.url}`;

  // Price history badge
  let priceBadge: { emoji: string; label: string; bg: string; text: string } | null = null;
  if (history.length >= 5) {
    const position = (p.price - minHist) / span;
    if (position <= 0.15) {
      priceBadge = { emoji: "🟢", label: "En su mínimo histórico", bg: "bg-lime-50", text: "text-lime-800" };
    } else if (position >= 0.85) {
      priceBadge = { emoji: "🔴", label: "En su precio máximo", bg: "bg-red-50", text: "text-red-800" };
    } else {
      priceBadge = { emoji: "🟡", label: "Precio normal", bg: "bg-amber-50", text: "text-amber-800" };
    }
  }

  // All prices: current product + matches, sorted cheapest first
  const allPrices = [p, ...matches].sort((a, b) => a.price - b.price);
  const cheapestPrice = allPrices[0]?.price ?? p.price;

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
          <div className="absolute right-4 top-4">
            <FavoriteButton productId={p.id} size="md" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: p.chainColor }}
          />
          <span className="font-semibold" style={{ color: p.chainColor }}>{p.chainName}</span>
          {p.brand && <span className="text-neutral-500">· {p.brand}</span>}
          {p.format && <span className="text-neutral-400">· {p.format}</span>}
        </div>
        <h1 className="mt-1 text-2xl font-bold leading-tight">{p.name}</h1>
        {p.isOnlineOnly && (
          <p className="mt-2 inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
            💻 Solo online — no disponible en tienda física
          </p>
        )}
      </div>

      {/* Precio destacado */}
      <div className="mt-4 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 text-white shadow-lg">
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {p.isOnSale ? "🏷️ En oferta" : "Precio hoy"}
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <div className="text-4xl font-bold">{formatCLP(p.price)}</div>
          {p.listPrice && (
            <div className="text-base font-medium text-neutral-400 line-through">
              {formatCLP(p.listPrice)}
            </div>
          )}
        </div>
        {p.ahorro && (
          <div className="mt-1 text-sm text-lime-400">
            Ahorras <strong>{formatCLP(p.ahorro)}</strong>
          </div>
        )}
        {priceBadge && (
          <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${priceBadge.bg} ${priceBadge.text}`}>
            {priceBadge.emoji} {priceBadge.label}
          </div>
        )}
        <div className="mt-3 text-xs text-neutral-500">
          Actualizado {timeAgo(p.scrapedAt)}
        </div>
      </div>

      {/* Add to list */}
      <div className="mt-4">
        <AddToListButton productId={p.id} size="lg" />
      </div>

      {/* Tabla comparativa de cadenas */}
      <section className="mt-5">
        <h2 className="text-base font-semibold">
          {allPrices.length > 1 ? "🏪 Comparativa de precios por cadena" : "🏪 Precio en esta cadena"}
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-xs text-neutral-500">
                <th className="px-4 py-2.5 text-left font-semibold">Cadena</th>
                <th className="px-4 py-2.5 text-right font-semibold">Precio</th>
                <th className="px-4 py-2.5 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {allPrices.map((v, i) => {
                const isCheapest = v.price === cheapestPrice;
                const isCurrent = v.id === p.id;
                return (
                  <tr
                    key={v.id}
                    className={`border-b border-neutral-100 last:border-0 ${isCheapest ? "bg-lime-50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: v.chainColor }}
                        />
                        <span className={`font-medium ${isCurrent ? "" : "text-neutral-700"}`}>
                          {v.chainName}
                        </span>
                        {isCheapest && i === 0 && (
                          <span className="rounded-full bg-lime-100 px-1.5 py-0.5 text-[10px] font-bold text-lime-800">
                            🏆 más barato
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${isCheapest ? "text-lime-700" : "text-neutral-700"}`}>
                        {formatCLP(v.price)}
                      </span>
                      {!isCheapest && cheapestPrice < v.price && (
                        <div className="text-[10px] text-red-500">
                          +{formatCLP(v.price - cheapestPrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AddToListButton productId={v.id} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {matches.length > 0 && (
          <p className="px-1 pt-2 text-[11px] text-neutral-400">
            Otras cadenas por similitud de nombre. Algunas pueden no ser exactamente el mismo producto.
          </p>
        )}
      </section>

      {/* Historial */}
      {history.length > 1 && (
        <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-neutral-200">
          <h2 className="text-sm font-semibold">📈 Historial de precio</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Mín {formatCLP(minHist)} · Máx {formatCLP(maxHist)} · {history.length}{" "}
            mediciones
          </p>
          <div className="mt-3 flex h-24 items-end gap-1">
            {history.slice(-30).map((h, i) => {
              const isMin = h.price === minHist;
              const isMax = h.price === maxHist;
              const isCurrent = i === history.slice(-30).length - 1;
              const heightPct = ((h.price - minHist) / span) * 100;
              const barColor = isCurrent
                ? "bg-lime-500"
                : isMin
                  ? "bg-lime-300"
                  : isMax
                    ? "bg-red-300"
                    : "bg-neutral-200";
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition ${barColor}`}
                  style={{ height: `${20 + heightPct * 0.8}%` }}
                  title={`${formatCLP(h.price)} · ${new Date(h.at).toLocaleDateString("es-CL")}`}
                />
              );
            })}
          </div>
          {/* Leyenda */}
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-neutral-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-lime-500" /> Hoy</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-lime-300" /> Mínimo</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-300" /> Máximo</span>
          </div>
        </div>
      )}

      {!p.isOnlineOnly && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">
          ⚠ Este es el <strong>precio web</strong>. El precio en tienda física
          puede diferir.
        </p>
      )}

      {/* CTA externo */}
      <div className="mt-6">
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-center font-semibold text-neutral-900 ring-1 ring-neutral-200 transition active:scale-[0.98]"
        >
          Ver en {p.chainName} →
        </a>
      </div>
    </main>
  );
}
