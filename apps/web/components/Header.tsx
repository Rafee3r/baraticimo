import Link from "next/link";
import { ComunaPicker } from "./ComunaPicker";

export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-emerald-600">B</span>aratícimo
        </Link>
        <ComunaPicker />
      </div>
    </header>
  );
}
