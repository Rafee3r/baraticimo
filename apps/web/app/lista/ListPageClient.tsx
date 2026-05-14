"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useList } from "../../components/ListContext";
import type { ProductRow } from "../../lib/queries";

function formatCLP(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

interface SubtotalByChain {
  chainSlug: string;
  chainName: string;
  chainColor: string;
  total: number;
  itemCount: number;
}

export function ListPageClient() {
  const { list, setQty, removeFromList, clearList, hydrated } = useList();
  const [products, setProducts] = useState<ProductRow[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (list.length === 0) {
      setProducts([]);
      return;
    }
    const ids = list.map((e) => e.id);
    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((r) => r.json())
      .then((data) => setProducts(data.products))
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

  // Compute subtotals per chain
  const byChain: Map<string, SubtotalByChain> = new Map();
  for (const entry of list) {
    const product = products.find((p) => p.id === entry.id);
    if (!product) continue;
    const key = product.chainSlug;
    const current = byChain.get(key) ?? {
      chainSlug: product.chainSlug,
      chainName: product.chainName,
      chainColor: product.chainColor,
      total: 0,
      itemCount: 0,
    };
    current.total += product.price * entry.qty;
    current.itemCount += entry.qty;
    byChain.set(key, current);
  }
  const subtotals = Array.from(byChain.values()).sort((a, b) => a.total - b.total);
  const grandTotal = subtotals.reduce((s, c) => s + c.total, 0);

  // Missing products (no longer in DB or not fetched)
  const inListIds = new Set(list.map((e) => e.id));
  const fetchedIds = new Set(products.map((p) => p.id));
  const missingIds = [...inListIds].filter((id) => !fetchedIds.has(id));

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

      {/* Resumen / comparativa */}
      {subtotals.length > 0 && (
        <section className="mt-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
            Total de tu lista
          </div>
          <div className="mt-1 text-4xl font-bold">{formatCLP(grandTotal)}</div>
          <p className="mt-1 text-sm text-emerald-50">
            {list.reduce((s, e) => s + e.qty, 0)} productos · {subtotals.length} cadena
            {subtotals.length > 1 ? "s" : ""}
          </p>
          {subtotals.length > 1 && (
            <div className="mt-4 space-y-2">
              {subtotals.map((s, i) => (
                <div
                  key={s.chainSlug}
                  className="flex items-center justify-between rounded-2xl bg-white/15 px-3 py-2 backdrop-blur"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: s.chainColor }}
                    />
                    <span className="font-medium">{s.chainName}</span>
                    <span className="text-xs text-emerald-100">
                      ({s.itemCount} prod.)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{formatCLP(s.total)}</span>
                    {i === 0 && subtotals.length > 1 && (
                      <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-bold text-yellow-900">
                        🏆 más barato
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

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
