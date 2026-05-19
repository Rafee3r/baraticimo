/**
 * Helpers compartidos para extracción de nombres en scrapers.
 * Filtra textos que son obvio "precio" o "banner promocional".
 */

export function looksLikePrice(t: string): boolean {
  return (
    /\$\s*[\d.,]/.test(t) ||
    /\bc\/u\b/i.test(t) ||
    /\bx\s+(kg|gr|g|ml|l|lt|un|unidad|cc)\b/i.test(t) ||
    /^[\s\n]*\d+\s*x\s*\$/i.test(t) ||
    /lleva\s+\d+\s+y\s+paga/i.test(t) ||
    /precio[s]?\s+increibl/i.test(t) ||
    /price\s+reduced/i.test(t) ||
    /^aprovecha/i.test(t) ||
    /^[%\d\s]+%/.test(t) // empieza con porcentaje tipo "-23%"
  );
}

/**
 * Dado un href + slug de cadena, reconstruye un nombre legible desde el URL.
 * Fallback de último recurso cuando el scraper no pudo extraer el nombre bien.
 */
export function slugToName(url: string, chainSlug: string): string | null {
  let slug: string | null = null;

  if (chainSlug === "unimarc") {
    const m = url.match(/\/product\/([^/?#]+)/);
    slug = m?.[1] ?? null;
  } else if (chainSlug === "tottus") {
    const m = url.match(/\/articulo\/\d+\/([^/?#]+)/);
    slug = m?.[1] ?? null;
  } else if (chainSlug === "ahumada") {
    const m = url.match(/\/([^/?#]+)-\d+\.html$/);
    slug = m?.[1] ?? null;
  } else if (chainSlug === "cruz-verde") {
    const m = url.match(/\/([^/?#]+)\/\d+\.html$/);
    slug = m?.[1] ?? null;
  } else if (chainSlug === "salcobrand") {
    const m = url.match(/\/products\/([^/?#]+)/);
    slug = m?.[1] ?? null;
  } else {
    // jumbo, santa-isabel: último segmento del path
    const segs = url.replace(/^https?:\/\/[^/]+/, "").split("/").filter(Boolean);
    slug = segs[segs.length - 1] ?? null;
    if (slug && /^\d+$/.test(slug)) slug = segs[segs.length - 2] ?? null;
  }

  if (!slug) return null;
  return slug
    .replace(/[-_]+/g, " ")
    .split(" ")
    .map((w) => (w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ")
    .trim();
}
