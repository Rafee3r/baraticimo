"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Estado client-side para "Mi lista" y "Favoritos".
 * Persistido en localStorage — sin cuenta, sin fricción.
 */

export interface ListEntry {
  id: string; // chainProduct.id
  qty: number;
}

interface ListContextType {
  list: ListEntry[];
  favs: string[];
  inList: (id: string) => number;
  isFav: (id: string) => boolean;
  addToList: (id: string, qty?: number) => void;
  removeFromList: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearList: () => void;
  toggleFav: (id: string) => void;
  hydrated: boolean;
}

const LIST_KEY = "baraticimo:list";
const FAVS_KEY = "baraticimo:favs";

const Ctx = createContext<ListContextType | null>(null);

export function ListProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<ListEntry[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hidratar desde localStorage
  useEffect(() => {
    try {
      const l = localStorage.getItem(LIST_KEY);
      const f = localStorage.getItem(FAVS_KEY);
      if (l) setList(JSON.parse(l));
      if (f) setFavs(JSON.parse(f));
    } catch {}
    setHydrated(true);
  }, []);

  // Persistir cambios
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  }, [list, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(FAVS_KEY, JSON.stringify(favs));
  }, [favs, hydrated]);

  const inList = useCallback(
    (id: string) => list.find((e) => e.id === id)?.qty ?? 0,
    [list],
  );
  const isFav = useCallback((id: string) => favs.includes(id), [favs]);

  const addToList = useCallback((id: string, qty = 1) => {
    setList((prev) => {
      const existing = prev.find((e) => e.id === id);
      if (existing) {
        return prev.map((e) => (e.id === id ? { ...e, qty: e.qty + qty } : e));
      }
      return [...prev, { id, qty }];
    });
  }, []);

  const removeFromList = useCallback((id: string) => {
    setList((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setList((prev) => {
      if (qty <= 0) return prev.filter((e) => e.id !== id);
      return prev.map((e) => (e.id === id ? { ...e, qty } : e));
    });
  }, []);

  const clearList = useCallback(() => setList([]), []);

  const toggleFav = useCallback((id: string) => {
    setFavs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  return (
    <Ctx.Provider
      value={{
        list,
        favs,
        inList,
        isFav,
        addToList,
        removeFromList,
        setQty,
        clearList,
        toggleFav,
        hydrated,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useList() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useList must be used within ListProvider");
  return v;
}
