import Link from "next/link";
import type { ProductRow } from "../lib/queries";

function formatCLP(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

interface Props {
  product: ProductRow;
  /** "grid" = card compacto en grilla; "list" = card horizontal con más info */
  variant?: "grid" | "list";
}

export function ProductCard({ product: p, variant = "grid" }: Props) {
  if (variant === "list") {
    return (
      <Link
        href={`/producto/${p.id}`}
        className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3 transition active:scale-[0.98]"
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.imageUrl}
              alt={p.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">
              🛒
            </div>
          )}
          {p.ahorroPct && (
            <span className="absolute left-1 top-1 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              −{p.ahorroPct}%
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-medium leading-snug">
            {p.name}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.chainColor }}
            />
            {p.chainName}
            {p.isOnlineOnly && (
              <span className="ml-1 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                💻
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-neutral-900">
              {formatCLP(p.price)}
            </span>
            {p.listPrice && (
              <span className="text-xs text-neutral-400 line-through">
                {formatCLP(p.listPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // grid variant
  return (
    <Link
      href={`/producto/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition active:scale-[0.98]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.name}
            className="h-full w-full object-contain p-2 transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            🛒
          </div>
        )}
        {p.ahorroPct && (
          <span className="absolute left-2 top-2 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white shadow">
            −{p.ahorroPct}%
          </span>
        )}
        {p.isOnlineOnly && (
          <span className="absolute right-2 top-2 rounded-full bg-sky-50/95 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-sky-700">
            💻 online
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: p.chainColor }}
          />
          {p.chainName}
        </div>
        <div className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-tight">
          {p.name}
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-base font-bold text-neutral-900">
            {formatCLP(p.price)}
          </span>
          {p.listPrice && (
            <span className="text-[11px] text-neutral-400 line-through">
              {formatCLP(p.listPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
