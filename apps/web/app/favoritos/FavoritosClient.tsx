"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useList } from "../../components/ListContext";
import { ProductCard } from "../../components/ProductCard";
import type { ProductRow } from "../../lib/queries";

export function FavoritosClient() {
  const { favs, hydrated } = useList();
  const [products, setProducts] = useState<ProductRow[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (favs.length === 0) {
      setProducts([]);
      return;
    }
    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: favs }),
    })
      .then((r) => r.json())
      .then((data) => setProducts(data.products))
      .catch(() => setProducts([]));
  }, [hydrated, favs.length]);

  if (!hydrated || products === null) {
    return (
      <main className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6">
        <h1 className="text-2xl font-bold">Guardados</h1>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-200" />
          ))}
        </div>
      </main>
    );
  }

  if (favs.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 sm:pt-6">
        <h1 className="text-2xl font-bold">Guardados</h1>
        <div className="mt-10 rounded-3xl bg-white p-10 text-center ring-1 ring-neutral-200">
          <div className="text-6xl">♡</div>
          <p className="mt-4 text-lg font-medium">No has guardado nada</p>
          <p className="mt-1 text-sm text-neutral-500">
            Toca el corazón ♥ en cualquier producto para guardarlo y volverlo a
            encontrar fácil.
          </p>
          <Link
            href="/buscar"
            className="mt-5 inline-block rounded-full bg-neutral-900 px-5 py-2.5 font-medium text-white"
          >
            Buscar productos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6">
      <h1 className="text-2xl font-bold">Guardados</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {products.length} producto{products.length === 1 ? "" : "s"}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} variant="grid" />
        ))}
      </div>
    </main>
  );
}
