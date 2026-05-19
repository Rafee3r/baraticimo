"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useList } from "./ListContext";

interface NavItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  showCount?: boolean;
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 4l9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function CartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h2l2 12h11l2-8H6" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  );
}
function CompareIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7h14M21 7l-3-3M21 7l-3 3" />
      <path d="M17 17H3M3 17l3 3M3 17l3-3" />
    </svg>
  );
}
function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r={active ? 2.2 : 1.8} />
      <circle cx="12" cy="12" r={active ? 2.2 : 1.8} />
      <circle cx="19" cy="12" r={active ? 2.2 : 1.8} />
    </svg>
  );
}

const ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: (a) => <HomeIcon active={a} /> },
  { href: "/buscar", label: "Buscar", icon: (a) => <SearchIcon active={a} /> },
  { href: "/lista", label: "Lista", icon: (a) => <CartIcon active={a} />, showCount: true },
  { href: "/comparar", label: "Comparar", icon: (a) => <CompareIcon active={a} /> },
  { href: "/mas", label: "Más", icon: (a) => <MoreIcon active={a} /> },
];

export function BottomNav() {
  const pathname = usePathname();
  const { list, hydrated } = useList();
  const listCount = hydrated ? list.reduce((s, e) => s + e.qty, 0) : 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-center justify-around">
        {ITEMS.map((it) => {
          const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] transition ${
                  active ? "text-emerald-600" : "text-neutral-500"
                }`}
              >
                <span className="relative">
                  {it.icon(active)}
                  {it.showCount && listCount > 0 && (
                    <span className="absolute -right-2 -top-1.5 min-w-[1.1rem] rounded-full bg-emerald-600 px-1 text-center text-[10px] font-bold leading-[1.1rem] text-white shadow">
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
