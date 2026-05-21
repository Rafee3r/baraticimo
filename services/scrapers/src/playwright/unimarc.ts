/**
 * Scraper de Unimarc (VTEX IO — misma arquitectura que Tottus).
 *
 * Unimarc usa VTEX IO con clases dinámicas (hash), así que usamos
 * los mismos selectores semánticos robustos que en tottus.ts:
 *  – productos via links que terminan en /p
 *  – nombre = texto más largo en la card que no sea precio
 *  – precio = patrones "$X.XXX" dentro de la card
 */
import { chromium, type Page } from "playwright";
import { prisma } from "../db.js";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const BASE_URL = "https://www.unimarc.cl";

// URLs reales de unimarc.cl (verificadas con Playwright)
const CATEGORIES = [
  "category/despensa",
  "category/lacteos-huevos-y-refrigerados",
  "category/quesos-y-fiambres",
  "category/frutas-y-verduras",
  "category/carnes",
  "category/panaderia-y-pasteleria",
  "category/congelados",
  "category/desayuno-y-dulces",
  "category/bebidas-y-licores",
  "category/limpieza",
  "category/perfumeria",
  "category/bebes-y-ninos",
  "category/mascotas",
  "category/hogar",
];

interface ExtractedProduct {
  externalId: string;
  url: string;
  name: string;
  price: number;
  listPrice: number | null;
  isOnSale: boolean;
  imageUrl: string | null;
  isOnlineOnly: boolean;
}

async function extractFromPage(page: Page): Promise<ExtractedProduct[]> {
  return page.evaluate(() => {
    // Unimarc usa /product/<nombre>
    const productHrefRe = /\/product\//i;

    function parsePrice(s: string): number | null {
      const m = s.match(/\$\s?([\d.,]+)/);
      if (!m) return null;
      const clean = m[1]!.replace(/\./g, "").replace(/,(\d{2})$/, ".$1").replace(/,/g, "");
      const n = parseFloat(clean);
      return isFinite(n) && n > 0 ? Math.round(n) : null;
    }

    const allLinks = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[];
    const productLinks = allLinks.filter((a) => {
      const href = a.getAttribute("href") ?? "";
      return productHrefRe.test(href) && href.length > 4;
    });

    const seen = new Set<string>();
    const out: ExtractedProduct[] = [];

    for (const link of productLinks) {
      const href = link.getAttribute("href")!;
      const cleanHref = href.split("?")[0]!;
      if (seen.has(cleanHref)) continue;

      let card: HTMLElement = link;
      for (let i = 0; i < 6; i++) {
        if (card.parentElement) card = card.parentElement;
        if (card.querySelector("img") && /\$\s?[\d.,]+/.test(card.textContent ?? "")) break;
      }

      // Buscar primero elementos típicos de nombre (h2/h3/clases name/title)
      let name: string | undefined;
      const nameEl = card.querySelector(
        'h2, h3, h4, [class*="name" i]:not(button), [class*="title" i]:not(button), [class*="product"][class*="text" i]',
      );
      if (nameEl) {
        const t = (nameEl.textContent ?? "").trim();
        if (t.length > 5 && t.length < 200 && !/^\$/.test(t)) name = t;
      }
      // Filtro de "esto NO es un nombre, es un precio promocional"
      const looksLikePrice = (t: string): boolean =>
        /\$\s*[\d.,]/.test(t) ||
        /\bc\/u\b/i.test(t) ||
        /\bx\s+(kg|gr|g|ml|l|lt|un|unidad)\b/i.test(t) ||
        /^[\s\n]*\d+\s*x\s*\$/i.test(t) ||
        /lleva\s+\d+\s+y\s+paga/i.test(t);

      // Fallback: texto más largo en la card (excluyendo textos que parecen precio)
      if (!name || looksLikePrice(name)) {
        const textNodes = Array.from(card.querySelectorAll("*"))
          .map((el) => el.textContent?.trim() ?? "")
          .filter((t) =>
            t.length > 8 &&
            t.length < 200 &&
            !/^\$/.test(t) &&
            !/^\d+$/.test(t) &&
            !looksLikePrice(t),
          );
        name = textNodes.sort((a, b) => b.length - a.length)[0];
      }
      if (!name) {
        // Último recurso: el slug de la URL → "Carozzi Spaghetti"
        const slug = cleanHref.replace(/^.*\/product\//, "").replace(/[-_]+/g, " ").trim();
        if (slug && slug.length > 3) {
          name = slug.split(" ")
            .map((w) => (w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
            .join(" ");
        }
      }
      if (!name) continue;

      // Limpiar prefijo "Agregar<marca-lowercase>" pegado al nombre real.
      // Ej: "AgregarmerkatAtun lomitos" → "Atun lomitos"
      //     "Agregarnuestra cocinaPasta cabello" → "Pasta cabello"
      //     "Agregarno+glutenPan de molde" → "Pan de molde"
      // IMPORTANTE: sin flag /i — el lookahead debe matchear SOLO mayúsculas.
      name = name.replace(/^Agregar[a-záéíóúñ0-9+\s&.\-]+?(?=[A-ZÁÉÍÓÚÑ])/, "").trim();
      // Quitar duplicación final de formato: "400 gr400 g" → "400 g"
      name = name.replace(/(\d+\s*[a-zA-Z]+)\s*\1\s*$/i, "$1").trim();

      const allText = card.textContent ?? "";

      // Detectar precios de referencia "por unidad" o "por kg" para excluirlos.
      // Ej: "$1.990 /kg", "$890 c/u", "$244c/u", "$3.50/ml", "c/u $890"
      const perUnitRe =
        /\$\s?[\d.,]+\s*\/?\s*(kg|kilo|gr?|ml|lt?|un\.?|unidad|c\.?\/?\s*u\.?)/gi;
      const perUnitSet = new Set<number>(
        Array.from(allText.matchAll(perUnitRe))
          .map((m) => parsePrice(m[0]))
          .filter((v): v is number => v !== null),
      );
      // Patrón inverso: "c/u $890" (etiqueta antes del precio)
      Array.from(allText.matchAll(/c\.?\/?\s*u\.?\s*[\$:]\s?[\d.,]+/gi))
        .forEach((m) => {
          const numMatch = m[0].match(/[\d.,]+$/);
          if (numMatch) {
            const v = parsePrice("$" + numMatch[0]);
            if (v !== null) perUnitSet.add(v);
          }
        });
      // Patrón "X c/u" / "X/u" sin prefijo $ (ej texto "244 c/u")
      Array.from(allText.matchAll(/\b([\d.,]+)\s*c\.?\/?\s*u\.?\b/gi))
        .forEach((m) => {
          const v = parsePrice("$" + m[1]);
          if (v !== null && v > 100) perUnitSet.add(v);
        });

      const allPrices = Array.from(allText.matchAll(/\$\s?[\d.,]+/g))
        .map((m) => parsePrice(m[0]))
        .filter((v): v is number => v !== null && v > 100 && !perUnitSet.has(v));

      if (allPrices.length === 0) continue;

      const struckElements = Array.from(
        card.querySelectorAll('[class*="line-through"], [style*="line-through"], s, del'),
      );
      const struckPrices = struckElements
        .map((el) => parsePrice(el.textContent ?? ""))
        .filter((v): v is number => v !== null && v > 100);

      let price: number;
      let listPrice: number | null = null;

      if (struckPrices.length > 0) {
        listPrice = Math.max(...struckPrices);
        const nonStruck = allPrices.filter((p) => !struckPrices.includes(p));
        price = nonStruck.length > 0 ? Math.min(...nonStruck) : Math.min(...allPrices);
      } else {
        price = Math.min(...allPrices);
      }

      if (listPrice && listPrice <= price) listPrice = null;

      const img = card.querySelector("img");
      const imageUrl = img?.getAttribute("src") ?? img?.getAttribute("data-src") ?? null;

      seen.add(cleanHref);
      const externalId = cleanHref
        .replace(/^\//, "")
        .replace(/\/p\/?$/, "")
        .replace(/[/?#]/g, "_");

      out.push({
        externalId,
        url: cleanHref,
        name: name.slice(0, 255),
        price,
        listPrice,
        isOnSale: listPrice !== null && listPrice > price,
        imageUrl,
        isOnlineOnly: false,
      });
    }

    return out;
  });
}

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 600;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 250);
    });
  });
  await page.waitForTimeout(1000);
}

async function scrapeCategory(page: Page, category: string): Promise<ExtractedProduct[]> {
  const MAX_PAGES = 5;
  const all: ExtractedProduct[] = [];
  const seen = new Set<string>();

  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    const url = pageNum === 1
      ? `${BASE_URL}/${category}`
      : `${BASE_URL}/${category}?page=${pageNum}`;
    console.log(`  → ${url}`);

    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (!res || !res.ok()) {
      console.log(`    HTTP ${res?.status()} — stop pagination`);
      break;
    }

    try {
      await page.waitForFunction(
        () => document.querySelectorAll('a[href*="/product/"]').length >= 3,
        { timeout: 30_000 },
      );
    } catch {
      console.log(`    sin productos — stop pagination`);
      break;
    }

    await page.waitForTimeout(2000);
    await autoScroll(page);

    const products = await extractFromPage(page);
    const fresh = products.filter((p) => !seen.has(p.externalId));
    fresh.forEach((p) => seen.add(p.externalId));
    all.push(...fresh);
    console.log(`    p${pageNum}: ${products.length} extraídos, ${fresh.length} nuevos`);
    if (fresh.length === 0) break;
  }

  console.log(`    ✓ ${all.length} productos totales en ${category}`);
  return all;
}

async function persistProducts(products: ExtractedProduct[]) {
  const chain = await prisma.chain.findUnique({ where: { slug: "unimarc" } });
  if (!chain) throw new Error("Cadena 'unimarc' no existe; corre el seed primero");

  let saved = 0;
  for (const p of products) {
    const productUrl = p.url.startsWith("http") ? p.url : `${BASE_URL}${p.url}`;
    const cp = await prisma.chainProduct.upsert({
      where: { chainId_externalId: { chainId: chain.id, externalId: p.externalId } },
      create: {
        chainId: chain.id,
        externalId: p.externalId,
        name: p.name,
        url: productUrl,
        imageUrl: p.imageUrl,
        isOnlineOnly: p.isOnlineOnly,
      },
      update: {
        name: p.name,
        url: productUrl,
        imageUrl: p.imageUrl,
        isOnlineOnly: p.isOnlineOnly,
        lastSeenAt: new Date(),
      },
    });
    await prisma.price.create({
      data: {
        chainProductId: cp.id,
        storeId: null,
        price: p.price,
        listPrice: p.listPrice,
        isOnSale: p.isOnSale,
        source: "PLAYWRIGHT",
      },
    });
    saved++;
  }
  return saved;
}

async function main() {
  const argLimit = process.argv.find((a) => a.startsWith("--limit="));
  const limit = argLimit ? Number(argLimit.split("=")[1]) : 999;

  console.log("\n=== UNIMARC ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1280, height: 900 },
    locale: "es-CL",
  });
  const page = await context.newPage();
  await page.addInitScript(`window.__name = (fn) => fn;`);

  let total = 0;
  for (const cat of CATEGORIES) {
    try {
      const products = await scrapeCategory(page, cat);
      const saved = await persistProducts(products.slice(0, limit));
      total += saved;
    } catch (err) {
      console.error(`  ✗ error en ${cat}:`, (err as Error).message);
    }
  }

  console.log(`✓ unimarc: ${total} productos persistidos`);
  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
