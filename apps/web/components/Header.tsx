import Link from "next/link";
import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-baseline gap-0 text-xl font-extrabold tracking-tight"
        >
          <span className="text-lime-500">b</span>
          <span className="text-neutral-900">aratícimo</span>
          <span className="ml-0.5 h-1.5 w-1.5 self-end rounded-full bg-yellow-400 mb-1.5" />
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
