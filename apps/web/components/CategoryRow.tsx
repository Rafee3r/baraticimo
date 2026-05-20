import Link from "next/link";
import { CATEGORIES } from "../lib/categories";

/**
 * Pills horizontales compactos para categorías. Más rápido de escanear
 * que cards grandes — patrón típico de apps tipo Cornershop, PedidosYa.
 */
export function CategoryRow() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
      <ul className="flex gap-2">
        {CATEGORIES.map((c) => (
          <li key={c.slug} className="shrink-0">
            <Link
              href={`/buscar?cat=${c.slug}`}
              className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium ring-1 ring-neutral-200 transition active:scale-95 hover:ring-lime-500"
            >
              <span className="text-base leading-none">{c.emoji}</span>
              <span className="whitespace-nowrap">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
