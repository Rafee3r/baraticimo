"use client";
import { useList } from "./ListContext";
import { useToast } from "./Toaster";

interface Props {
  productId: string;
  size?: "lg" | "sm";
}

export function AddToListButton({ productId, size = "lg" }: Props) {
  const { inList, addToList, setQty, hydrated } = useList();
  const { toast } = useToast();
  if (!hydrated) return null;
  const qty = inList(productId);

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addToList(productId, 1);
          toast("Agregado a tu lista");
        }}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 font-semibold text-white transition active:scale-[0.98] ${
          size === "lg" ? "py-3.5 text-base" : "px-3 py-1.5 text-xs"
        }`}
      >
        {size === "lg" ? "🛒 Agregar a mi lista" : "+ Lista"}
      </button>
    );
  }

  return (
    <div
      className={`flex items-center justify-between rounded-2xl bg-lime-50 ring-1 ring-lime-300 ${
        size === "lg" ? "px-2 py-2" : "px-1.5 py-1"
      }`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setQty(productId, qty - 1);
        }}
        className={`rounded-xl bg-white font-bold text-lime-700 ring-1 ring-lime-300 transition active:scale-90 ${
          size === "lg" ? "h-10 w-10 text-xl" : "h-7 w-7 text-sm"
        }`}
        aria-label="Quitar 1"
      >
        −
      </button>
      <div
        className={`font-bold text-lime-700 ${
          size === "lg" ? "text-lg" : "text-sm"
        }`}
      >
        {qty}
        <span className={size === "lg" ? "ml-1 text-xs font-medium" : "hidden"}>
          en lista
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setQty(productId, qty + 1);
        }}
        className={`rounded-xl bg-neutral-900 font-bold text-white transition active:scale-90 ${
          size === "lg" ? "h-10 w-10 text-xl" : "h-7 w-7 text-sm"
        }`}
        aria-label="Agregar 1"
      >
        +
      </button>
    </div>
  );
}
