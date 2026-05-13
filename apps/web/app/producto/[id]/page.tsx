import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getChain, formatCLP } from "../../../lib/mock-data";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return notFound();

  const sorted = [...product.prices].sort((a, b) => a.price - b.price);
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  const minChain = getChain(min.chainSlug)!;
  const ahorro = max.price - min.price;
  const ahorroPct = Math.round((ahorro / max.price) * 100);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/buscar" className="text-sm text-neutral-500 hover:underline">
        ← Volver a resultados
      </Link>

      <div className="mt-4 flex gap-5 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-6xl">
          {product.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-neutral-500">
            {product.category}
          </div>
          <h1 className="mt-1 text-2xl font-bold">{product.name}</h1>
          <div className="mt-1 text-sm text-neutral-600">
            {product.brand} · {product.format}
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          🏆 Más barato hoy
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <div className="text-3xl font-bold text-emerald-700">
            {formatCLP(min.price)}
          </div>
          <div className="text-base font-medium text-emerald-800">
            en {minChain.name}
          </div>
        </div>
        {ahorro > 0 && (
          <div className="mt-2 text-sm text-emerald-800">
            Ahorras <strong>{formatCLP(ahorro)}</strong> ({ahorroPct}%) comparado con
            el más caro
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Comparativa por cadena</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Ordenado de más barato a más caro
        </p>

        <ul className="mt-4 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {sorted.map((pr, i) => {
            const chain = getChain(pr.chainSlug)!;
            const diff = pr.price - min.price;
            return (
              <li
                key={pr.chainSlug}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: chain.color }}
                >
                  {chain.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{chain.name}</div>
                  <div className="text-xs text-neutral-500">{chain.kind}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {pr.isOnSale && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        Oferta
                      </span>
                    )}
                    <div
                      className={`text-lg font-bold ${
                        i === 0 ? "text-emerald-700" : "text-neutral-900"
                      }`}
                    >
                      {formatCLP(pr.price)}
                    </div>
                  </div>
                  {i === 0 ? (
                    <div className="text-xs font-medium text-emerald-700">
                      ✓ El más barato
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500">
                      +{formatCLP(diff)} más
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-8 text-center text-xs text-neutral-400">
        Precios actualizados hoy · Datos de demostración
      </p>
    </main>
  );
}
