"use client";
import { useList } from "./ListContext";

interface Props {
  productId: string;
  size?: "sm" | "md";
}

export function FavoriteButton({ productId, size = "md" }: Props) {
  const { isFav, toggleFav, hydrated } = useList();
  if (!hydrated) {
    return (
      <button
        type="button"
        className="rounded-full bg-white/80 p-2 backdrop-blur ring-1 ring-neutral-200"
        aria-label="Favorito"
        disabled
      >
        <span className="text-base text-neutral-300">♡</span>
      </button>
    );
  }
  const fav = isFav(productId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFav(productId);
      }}
      className={`rounded-full bg-white/90 backdrop-blur ring-1 ring-neutral-200 transition active:scale-90 ${
        size === "md" ? "p-2.5 text-xl" : "p-1.5 text-base"
      }`}
      aria-label={fav ? "Quitar favorito" : "Guardar como favorito"}
    >
      <span className={fav ? "text-red-500" : "text-neutral-400"}>{fav ? "♥" : "♡"}</span>
    </button>
  );
}
