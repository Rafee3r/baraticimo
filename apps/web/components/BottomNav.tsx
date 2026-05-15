"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useList } from "./ListContext";

const ITEMS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/buscar", label: "Buscar", icon: "🔍" },
  { href: "/lista", label: "Lista", icon: "🛒", showCount: true },
  { href: "/comparar", label: "Comparar", icon: "🔀" },
  { href: "/mas", label: "Más", icon: "⋯" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { list, hydrated } = useList();
  const listCount = hydrated ? list.reduce((s, e) => s + e.qty, 0) : 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-center justify-around">
        {ITEMS.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] ${
                  active ? "text-emerald-600" : "text-neutral-500"
                }`}
              >
                <span className="relative text-xl leading-none">
                  {it.icon}
                  {it.showCount && listCount > 0 && (
                    <span className="absolute -right-3 -top-1 min-w-[1.25rem] rounded-full bg-emerald-600 px-1 text-center text-[10px] font-bold leading-5 text-white shadow">
                      {listCount}
                    </span>
                  )}
                </span>
                <span className="font-medium">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
