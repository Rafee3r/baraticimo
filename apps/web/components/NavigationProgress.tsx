"use client";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Barra de progreso superior que aparece cuando estás navegando entre rutas.
 * Detecta cambios de pathname/searchParams y muestra una barra animada
 * mientras Next.js carga la siguiente ruta.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostrar brevemente al cambiar de ruta
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 600);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  // Interceptar clicks en links para mostrar la barra inmediatamente
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (target.getAttribute("target") === "_blank") return;
      setVisible(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!visible) return null;
  return <div className="progress-indeterminate" />;
}
