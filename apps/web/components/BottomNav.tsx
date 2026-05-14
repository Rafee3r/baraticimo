"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/buscar", label: "Buscar", icon: "🔍" },
  { href: "/favoritos", label: "Guardados", icon: "♥" },
  { href: "/mas", label: "Más", icon: "⋯" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-center justify-around">
        {ITEMS.map((it) => {
          const active =
            it.href === "/"
              ? pathname === "/"
              : pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-2.5 text-xs ${
                  active ? "text-emerald-600" : "text-neutral-500"
                }`}
              >
                <span className="text-xl leading-none">{it.icon}</span>
                <span className="font-medium">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
