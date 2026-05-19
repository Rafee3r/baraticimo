"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

const SUGERENCIAS_RAPIDAS = [
  "leche entera",
  "pan de molde",
  "arroz",
  "detergente",
  "pañales",
  "yogurt",
  "huevos",
  "aceite",
  "pasta de dientes",
  "papel higiénico",
];

export function SearchInput({ defaultValue = "", size = "md", action = "/buscar" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [phIdx, setPhIdx] = useState(0);
  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Rotar el placeholder cada 2.5s
  useEffect(() => {
    if (value) return;
    const id = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 2500);
    return () => clearInterval(id);
  }, [value]);

  const lg = size === "lg";
  const loading = isPending;
  const showSugerencias = focused && value.length === 0;

  // Filtra sugerencias por lo que está escribiendo
  const matchingSugerencias =
    value.length > 0
      ? SUGERENCIAS_RAPIDAS.filter((s) => s.toLowerCase().startsWith(value.toLowerCase()))
          .filter((s) => s.toLowerCase() !== value.toLowerCase())
          .slice(0, 4)
      : [];

  function submit(query: string) {
    if (!query.trim()) return;
    startTransition(() => {
      router.push(`${action}?q=${encodeURIComponent(query.trim())}`);
    });
  }

  return (
    <div className="relative w-full">
      <form
        ref={formRef}
        action={action}
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="w-full"
      >
        <div
          className={`flex items-center gap-2 rounded-2xl bg-white shadow-sm transition focus-within:shadow-md ring-1 ring-neutral-200 focus-within:ring-2 focus-within:ring-emerald-500 ${
            lg ? "px-4 py-1" : "px-3 py-0.5"
          }`}
        >
          {loading ? (
            <SpinnerIcon size={lg ? 22 : 18} />
          ) : (
            <span className={lg ? "text-2xl" : "text-lg"}>🔍</span>
          )}
          <input
            name="q"
            type="search"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={`Buscar ${PLACEHOLDERS[phIdx]}…`}
            className={`flex-1 bg-transparent text-neutral-900 placeholder:text-neutral-400 outline-none ${
              lg ? "py-3 text-lg" : "py-2 text-base"
            }`}
          />
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className={`shrink-0 rounded-xl bg-emerald-600 font-semibold text-white transition active:scale-95 hover:bg-emerald-700 disabled:opacity-60 ${
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

      {/* Dropdown de sugerencias (autocomplete simple) */}
      {(showSugerencias || matchingSugerencias.length > 0) && !loading && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-neutral-200 fade-in-up">
          {showSugerencias && (
            <>
              <div className="px-4 pt-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Búsquedas populares
              </div>
              {SUGERENCIAS_RAPIDAS.slice(0, 6).map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setValue(s);
                    submit(s);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-neutral-700 transition hover:bg-neutral-50"
                >
                  <span className="text-neutral-400">🔍</span> {s}
                </button>
              ))}
            </>
          )}
          {matchingSugerencias.length > 0 && (
            <>
              {matchingSugerencias.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setValue(s);
                    submit(s);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-neutral-700 transition hover:bg-neutral-50"
                >
                  <span className="text-neutral-400">↗</span> {s}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SpinnerIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#10b981"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin"
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
