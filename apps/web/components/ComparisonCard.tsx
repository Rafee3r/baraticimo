"use client";

import Link from "next/link";
import type { CrossChainDeal } from "../lib/queries";
import { AddToListButton } from "./AddToListButton";

function formatCLP(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

interface Props {
  deal: CrossChainDeal;
}

export function ComparisonCard({ deal }: Props) {
  const { cheaper, pricier, savings, savingsPct } = deal;

  return (
    <div className="rounded-2xl bg-white ring-1 ring-neutral-200 overflow-hidden">
      {/* Header: product name + savings badge */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {cheaper.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cheaper.imageUrl}
            alt={cheaper.name}
            className="h-12 w-12 shrink-0 rounded-xl object-contain bg-neutral-50 p-1"
          />
        )}
        <div className="min-w-0 flex-1">
          <Link href={`/producto/${cheaper.id}`} className="line-clamp-2 text-sm font-semibold leading-tight hover:underline">
            {cheaper.name}
          </Link>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-bold text-lime-800">
            Ahorras {formatCLP(savings)} · {savingsPct}% menos
          </div>
        </div>
      </div>

      {/* Two columns: cheap vs pricier */}
      <div className="grid grid-cols-2 gap-px bg-neutral-100">
        {/* Cheaper */}
        <Link
          href={`/producto/${cheaper.id}`}
          className="flex flex-col gap-1 p-3"
          style={{ borderLeft: `3px solid ${cheaper.chainColor}`, backgroundColor: `${cheaper.chainColor}10` }}
        >
          <div className="text-[11px] font-bold" style={{ color: cheaper.chainColor }}>
            🏆 {cheaper.chainName}
          </div>
          <div className="text-lg font-bold text-neutral-900">{formatCLP(cheaper.price)}</div>
          <AddToListButton productId={cheaper.id} size="sm" />
        </Link>

        {/* Pricier */}
        <Link
          href={`/producto/${pricier.id}`}
          className="flex flex-col gap-1 bg-neutral-50 p-3"
        >
          <div className="text-[11px] font-semibold text-neutral-400">
            {pricier.chainName}
          </div>
          <div className="text-lg font-bold text-neutral-400 line-through decoration-1">
            {formatCLP(pricier.price)}
          </div>
          <div className="text-[10px] text-neutral-400">+{formatCLP(savings)} más caro</div>
        </Link>
      </div>
    </div>
  );
}
