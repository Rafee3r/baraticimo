/**
 * Búsqueda inteligente en 3 niveles:
 *
 * 1. Búsqueda directa (0 tokens) — retorna si ≥4 resultados
 * 2. Extracción de keywords con AI (~200 tokens, caché 24h) — para lenguaje natural / typos
 * 3. Búsqueda en catálogo completo con AI (~9.500 tokens, caché 1h) — solo si 0 resultados
 *
 * Si la IA falla en cualquier nivel, cae silenciosamente al resultado anterior.
 */

import { unstable_cache } from "next/cache";
import { callDeepSeekJSON } from "./ai";
import { searchProducts, searchProductsByKeywords, getProductsByIds } from "./queries";
import type { ProductRow } from "./queries";
import { prisma } from "./db";

// ─── Nivel 2: extracción de keywords ────────────────────────────────────────

const KEYWORD_SYSTEM = `Eres un asistente de búsqueda de supermercado chileno. Dado un texto de búsqueda en español, extrae 1-4 palabras clave de producto para buscar en una base de datos. Responde SOLO con JSON válido: {"keywords":["palabra1","palabra2"]}. Si la búsqueda ya es una palabra de producto (ej: "leche"), devuelve esa misma palabra. Normaliza typos chilenos: "yoghurt"→"yogurt", "maiscena"→"maicena", "ketchup"→"ketchup". Nunca devuelvas palabras genéricas como "producto", "quiero", "necesito", "algo", "para".`;

const getCachedKeywords = unstable_cache(
  async (query: string): Promise<string[]> => {
    const data = await callDeepSeekJSON<{ keywords: string[] }>(
      KEYWORD_SYSTEM,
      query,
    );
    return Array.isArray(data.keywords) ? data.keywords.filter(Boolean) : [];
  },
  ["ai-keywords"],
  { revalidate: 86400 }, // 24h — los keywords no cambian con el tiempo
);

// ─── Nivel 3: búsqueda en catálogo completo (178k context) ──────────────────

const CATALOG_SYSTEM = (query: string) =>
  `Eres un buscador de productos de supermercado chileno. El usuario buscó: "${query}". De la siguiente lista de productos, selecciona los más relevantes (máximo 8). Responde SOLO con JSON válido: {"ids":["id1","id2",...]}. Si ninguno es relevante, devuelve {"ids":[]}.`;

const getCachedCatalogSearch = unstable_cache(
  async (query: string): Promise<string[]> => {
    const allProducts = await prisma.chainProduct.findMany({
      select: { id: true, name: true, brand: true, format: true },
      take: 800,
      orderBy: { lastSeenAt: "desc" },
    });
    const data = await callDeepSeekJSON<{ ids: string[] }>(
      CATALOG_SYSTEM(query),
      JSON.stringify(allProducts),
    );
    return Array.isArray(data.ids) ? data.ids.filter(Boolean) : [];
  },
  ["ai-catalog"],
  { revalidate: 3600 }, // 1h
);

// ─── API pública ─────────────────────────────────────────────────────────────

export async function smartSearch(
  query: string,
  opts: { limit?: number; inStoreOnly?: boolean } = {},
): Promise<ProductRow[]> {
  const q = query.trim();
  if (!q) return [];

  // Nivel 1: búsqueda directa — 0 tokens IA
  const direct = await searchProducts(q, opts);
  if (direct.length >= 4) return direct;

  // Nivel 2: extracción de keywords con IA (~200 tokens, cacheado)
  try {
    const keywords = await getCachedKeywords(q);
    if (keywords.length > 0) {
      const enhanced = await searchProductsByKeywords(keywords, opts);
      if (enhanced.length > 0) {
        // Merge: resultados directos primero (exact match), luego los de AI
        const seen = new Set(direct.map((p) => p.id));
        const merged = [
          ...direct,
          ...enhanced.filter((p) => !seen.has(p.id)),
        ];
        return merged.slice(0, opts.limit ?? 80);
      }
    }
  } catch {
    // AI falló — continúa al siguiente nivel
  }

  // Si ya tenemos algo del nivel 1, retorna eso
  if (direct.length > 0) return direct;

  // Nivel 3: búsqueda en catálogo completo (~9.500 tokens, solo cuando 0 resultados)
  try {
    const ids = await getCachedCatalogSearch(q);
    if (ids.length > 0) {
      return getProductsByIds(ids);
    }
  } catch {
    // Nivel 3 falló — retorna vacío
  }

  return direct;
}
