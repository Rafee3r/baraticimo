"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useList } from "../../components/ListContext";
import type { ProductRow } from "../../lib/queries";
import type { ChainTotal } from "../api/lista-comparar/route";

function formatCLP(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

export function ListPageClient() {
  const { list, setQty, removeFromList, clearList, hydrated } = useList();
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [chainComparison, setChainComparison] = useState<ChainTotal[] | null>(null);
  const [comparingChains, setComparingChains] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (list.length === 0) {
      setProducts([]);
      setChainComparison(null);
      return;
    }
    const ids = list.map((e) => e.id);
    const items = list.map((e) => ({ id: e.id, qty: e.qty }));

    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products);

        // Comparativa entre cadenas (siempre, con 1+ producto)
        setComparingChains(true);
        setChainComparison(null);
        fetch("/api/lista-comparar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        })
          .then((r) => r.json())
          .then((d) => setChainComparison(d.chains ?? []))
          .catch(() => setChainComparison([]))
          .finally(() => setComparingChains(false));

        // Tip IA si hay 3+ productos
        if (list.length >= 3) {
          fetch("/api/lista-tip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          })
            .then((r) => r.json())
            .then((d) => setTip(d.tip ?? null))
            .catch(() => {});
        }
      })
      .catch(() => setProducts([]));
  }, [hydrated, list.length]); // re-fetch when item is added/removed (length changes)

  if (!hydrated || products === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 sm:pt-6">
        <h1 className="text-2xl font-bold">Mi lista</h1>
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-200" />
          ))}
        </div>
      </main>
    );
  }

  if (list.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 sm:pt-6">
        <h1 className="text-2xl font-bold">Mi lista</h1>
        <div className="mt-10 rounded-3xl bg-white p-10 text-center ring-1 ring-neutral-200">
          <div className="text-6xl">🛒</div>
          <p className="mt-4 text-lg font-medium">Tu lista está vacía</p>
          <p className="mt-1 text-sm text-neutral-500">
            Toca <strong className="text-neutral-900">🛒 Agregar a mi lista</strong> en
            cualquier producto para empezar a comparar el costo total.
          </p>
          <Link
            href="/buscar"
            className="mt-5 inline-block rounded-full bg-emerald-600 px-5 py-2.5 font-medium text-white"
          >
            Buscar productos
          </Link>
        </div>
      </main>
    );
  }

  // Total actual de la lista tal como está (productos elegidos por el usuario)
  const grandTotal = list.reduce((sum, entry) => {
    const product = products.find((p) => p.id === entry.id);
    return sum + (product ? product.price * entry.qty : 0);
  }, 0);

  // Missing products (no longer in DB or not fetched)
  const inListIds = new Set(list.map((e) => e.id));
  const fetchedIds = new Set(products.map((p) => p.id));
  const missingIds = [...inListIds].filter((id) => !fetchedIds.has(id));

  // Cadenas de la comparativa con cobertura completa o alta
  const fullCoverage = chainComparison?.filter((c) => c.covered === c.totalItems) ?? [];
  const bestChain = fullCoverage[0] ?? chainComparison?.[0] ?? null;
  const worstChain = fullCoverage.length > 1 ? fullCoverage[fullCoverage.length - 1] : null;
  const maxSavings = bestChain && worstChain ? worstChain.total - bestChain.total : 0;

  return (
    <main className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Mi lista</h1>
        {list.length > 0 && (
          <button
            onClick={() => {
              if (confirm("¿Vaciar la lista?")) clearList();
            }}
            className="text-sm text-red-500 hover:underline"
          >
            Vaciar
          </button>
        )}
      </div>

      {/* Resumen total */}
      <section className="mt-4 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-lg">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
          Total de tu lista
        </div>
        <div className="mt-1 text-4xl font-bold">{formatCLP(grandTotal)}</div>
        <p className="mt-1 text-sm text-emerald-100">
          {list.reduce((s, e) => s + e.qty, 0)} producto{list.reduce((s, e) => s + e.qty, 0) !== 1 ? "s" : ""}
        </p>
        {tip && (
          <div className="mt-3 rounded-2xl bg-yellow-300/90 px-3 py-2.5 text-sm font-medium text-yellow-900">
            💡 {tip}
          </div>
        )}
      </section>

      {/* Comparativa entre cadenas */}
      <section className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-neutral-200">
        <h2 className="text-base font-bold">¿Dónde sale más barata tu lista?</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Comparamos los mismos productos en cada cadena
        </p>

        {/* Cargando */}
        {comparingChains && (
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-2xl bg-neutral-100" />
            ))}
          </div>
        )}

        {/* Resultados */}
        {!comparingChains && chainComparison !== null && (
          <>
            {chainComparison.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">
                No encontramos los mismos productos en otras cadenas todavía.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {chainComparison.map((c, i) => {
                  const isBest = i === 0;
                  const diff = c.total - (chainComparison[0]?.total ?? 0);
                  const partial = c.covered < c.totalItems;
                  return (
                    <div
                      key={c.chainSlug}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                        isBest
                          ? "bg-emerald-50 ring-1 ring-emerald-200"
                          : "bg-neutral-50 ring-1 ring-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ background: c.chainColor }}
                        />
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold">
                            {c.chainName}
                            {isBest && chainComparison.length > 1 && (
                              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                🏆 más barato
                              </span>
                            )}
                          </div>
                          {partial && (
                            <div className="text-[10px] text-neutral-400">
                              {c.covered} de {c.totalItems} productos encontrados
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${isBest ? "text-emerald-700" : "text-neutral-700"}`}>
                          {formatCLP(c.total)}
                        </div>
                        {!isBest && diff > 0 && (
                          <div className="text-[11px] text-red-500">
                            +{formatCLP(diff)} más caro
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {maxSavings > 0 && (
              <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
                💰 Comprando en <strong>{bestChain?.chainName}</strong> en vez de{" "}
                <strong>{worstChain?.chainName}</strong> ahorras{" "}
                <strong>{formatCLP(maxSavings)}</strong> en esta lista.
              </div>
            )}

            <p className="mt-3 text-[11px] text-neutral-400">
              Los precios son por similitud de nombre. Algunos productos pueden no ser exactamente iguales entre cadenas.
            </p>
          </>
        )}
      </section>

      {/* Productos */}
      <section className="mt-5 space-y-3">
        {list.map((entry) => {
          const product = products.find((p) => p.id === entry.id);
          if (!product) return null;
          return (
            <div
              key={entry.id}
              className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-neutral-200"
            >
              <Link
                href={`/producto/${product.id}`}
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100"
              >
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-3xl">🛒</span>
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/producto/${product.id}`}
                    className="line-clamp-2 text-sm font-medium leading-snug"
                  >
                    {product.name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: product.chainColor }}
                    />
                    {product.chainName}
                    <span>· {formatCLP(product.price)} c/u</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQty(entry.id, entry.qty - 1)}
                      className="h-8 w-8 rounded-lg bg-neutral-100 font-bold text-neutral-700"
                      aria-label="Restar"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold">{entry.qty}</span>
                    <button
                      onClick={() => setQty(entry.id, entry.qty + 1)}
                      className="h-8 w-8 rounded-lg bg-emerald-600 font-bold text-white"
                      aria-label="Sumar"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold">
                      {formatCLP(product.price * entry.qty)}
                    </div>
                    <button
                      onClick={() => removeFromList(entry.id)}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {missingIds.map((id) => (
          <div
            key={id}
            className="flex items-center justify-between rounded-2xl bg-neutral-100 p-3 text-sm text-neutral-500"
          >
            <span>Producto no disponible</span>
            <button
              onClick={() => removeFromList(id)}
              className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-neutral-200"
            >
              Quitar
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
