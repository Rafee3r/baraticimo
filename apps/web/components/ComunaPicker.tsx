"use client";
import { useEffect, useState } from "react";
import { COMUNAS } from "../lib/mock-data";

export function ComunaPicker() {
  const [open, setOpen] = useState(false);
  const [comuna, setComuna] = useState<string>("Santiago");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("comuna") : null;
    if (saved) setComuna(saved);
  }, []);

  const pick = (c: string) => {
    setComuna(c);
    localStorage.setItem("comuna", c);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:border-neutral-900"
      >
        <span className="text-neutral-500">📍</span>
        <span className="font-medium">{comuna}</span>
        <span className="text-neutral-400">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 max-h-80 w-56 overflow-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {COMUNAS.map((c) => (
            <button
              key={c}
              onClick={() => pick(c)}
              className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-100 ${
                c === comuna ? "bg-neutral-50 font-medium" : ""
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
