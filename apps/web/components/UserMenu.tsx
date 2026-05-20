"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200" />;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition active:scale-95 hover:bg-neutral-800"
      >
        Iniciar sesión
      </Link>
    );
  }

  const initial = (session.user.name?.[0] ?? session.user.email?.[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-neutral-900 text-sm font-bold text-white ring-2 ring-white shadow-sm transition active:scale-95"
        aria-label="Mi cuenta"
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-40 w-56 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-neutral-200">
          <div className="px-3 py-2">
            <div className="text-sm font-semibold truncate">
              {session.user.name ?? "Mi cuenta"}
            </div>
            <div className="text-xs text-neutral-500 truncate">
              {session.user.email}
            </div>
          </div>
          <div className="my-1 h-px bg-neutral-100" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
