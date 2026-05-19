import Link from "next/link";
import { CATEGORIES } from "../lib/categories";

export function CategoryRow() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
      <ul className="flex gap-3 sm:grid sm:grid-cols-5 sm:gap-3 lg:grid-cols-10">
        {CATEGORIES.map((c) => (
          <li key={c.slug} className="shrink-0">
            <Link
              href={`/buscar?cat=${c.slug}`}
              className="flex w-20 flex-col items-center gap-1.5 rounded-2xl bg-white p-3 ring-1 ring-neutral-200 transition active:scale-95 hover:ring-emerald-500 sm:w-auto"
            >
              <span className="text-3xl leading-none">{c.emoji}</span>
              <span className="text-center text-[11px] font-medium leading-tight">
                {c.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
