import Link from "next/link";
import { ComunaPicker } from "./ComunaPicker";
import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-1 text-xl font-bold tracking-tight"
        >
          <span className="text-emerald-600">B</span>
          <span>aratícimo</span>
        </Link>
        <div className="flex items-center gap-3">
          <ComunaPicker />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
