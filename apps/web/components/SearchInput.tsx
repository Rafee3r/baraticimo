"use client";
import { useEffect, useState } from "react";

interface Props {
  defaultValue?: string;
  size?: "lg" | "md";
  action?: string;
}

const PLACEHOLDERS = [
  "leche",
  "detergente",
  "pañales",
  "café",
  "yogurt",
  "arroz",
  "shampoo",
  "papel higiénico",
];

export function SearchInput({ defaultValue = "", size = "md", action = "/buscar" }: Props) {
  const [phIdx, setPhIdx] = useState(0);

  // Rotar el placeholder cada 2.5 segundos para sugerir búsquedas
  useEffect(() => {
    if (defaultValue) return;
    const id = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 2500);
    return () => clearInterval(id);
  }, [defaultValue]);

  const lg = size === "lg";

  return (
    <form action={action} className="w-full">
      <div
        className={`flex items-center gap-2 rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 transition focus-within:ring-2 focus-within:ring-emerald-500 ${
          lg ? "px-4 py-1" : "px-3 py-0.5"
        }`}
      >
        <span className={lg ? "text-2xl" : "text-lg"}>🔍</span>
        <input
          name="q"
          type="search"
          autoComplete="off"
          defaultValue={defaultValue}
          placeholder={`Buscar ${PLACEHOLDERS[phIdx]}…`}
          className={`flex-1 bg-transparent text-neutral-900 placeholder:text-neutral-400 outline-none ${
            lg ? "py-3 text-lg" : "py-2 text-base"
          }`}
        />
        <button
          type="submit"
          className={`shrink-0 rounded-xl bg-emerald-600 font-semibold text-white transition active:scale-95 hover:bg-emerald-700 ${
            lg ? "px-3 py-2.5 sm:px-5" : "px-3 py-1.5 text-sm"
          }`}
        >
          {lg ? (
            <>
              <span className="sm:hidden">→</span>
              <span className="hidden sm:inline">Buscar</span>
            </>
          ) : (
            "Buscar"
          )}
        </button>
      </div>
    </form>
  );
}
