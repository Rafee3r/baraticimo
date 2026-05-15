/**
 * Scraper de Líder / Walmart Chile (lider.cl).
 *
 * Líder usa una plataforma Walmart propia (React + GraphQL interno).
 * Las URLs de producto siguen el patrón:
 *   /tienda/product/<nombre-slug>/<sku>
 *   o /<nombre>/<sku>/p (según la versión)
 *
 * Usamos selectores semánticos robustos ya que las clases CSS son dinámicas:
 *  – links a páginas de producto via atributo href que termina en un ID numérico
 *    precedido de "/" o que contenga "/tienda/product/"
 *  – nombre = texto más largo en la card que no sea precio ni número puro
 *  – precio = patrones "$X.XXX" dentro de la card
 */
import { chromium, type Page } from "playwright";
import { prisma } from "../db.js";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const BASE_URL = "https://www.lider.cl";

const CATEGORIES = [
  "despensa",
  "lacteos",
  "bebidas",
  "frutas-y-verduras",
  "carnes-y-aves",
  "panaderia-y-pasteleria",
  "congelados",
  "snacks-y-chocolates",
  "limpieza-del-hogar",
  "cuidado-personal",
  "mascotas",
  "bebes",
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
    // Líder usa: /tienda/product/<slug>/<sku> o simplemente /<slug>/<sku>
    // El patrón clave: href que contiene "/tienda/product/" o termina en un número (SKU)
    const productHrefRe = /\/tienda\/product\//i;
    // Fallback: href que termina en un número de al menos 5 dígitos (SKU)
    const skuHrefRe = /\/\d{5,}\/?$/;

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
      return (productHrefRe.test(href) || skuHrefRe.test(href)) && href.length > 4;
    });

    const seen = new Set<string>();
    const out: ExtractedProduct[] = [];

    for (const link of productLinks) {
      const href = link.getAttribute("href")!;
      const cleanHref = href.split("?")[0]!;
      if (seen.has(cleanHref)) continue;

      // Subir hasta 6 niveles para encontrar la card del producto
      let card: HTMLElement = link;
      for (let i = 0; i < 6; i++) {
        if (card.parentElement) card = card.parentElement;
        if (card.querySelector("img") && /\$\s?[\d.,]+/.test(card.textContent ?? "")) break;
      }

      // Nombre: texto más largo que no sea precio ni número puro
      const textNodes = Array.from(card.querySelectorAll("*"))
        .map((el) => el.textContent?.trim() ?? "")
        .filter((t) => t.length > 8 && t.length < 200 && !/^\$/.test(t) && !/^\d+$/.test(t));
      const name = textNodes.sort((a, b) => b.length - a.length)[0];
      if (!name) continue;

      // Precios en la card
      const allText = card.textContent ?? "";
      const allPrices = Array.from(allText.matchAll(/\$\s?[\d.,]+/g))
        .map((m) => parsePrice(m[0]))
        .filter((v): v is number => v !== null && v > 100);

      if (allPrices.length === 0) continue;

      // Precio tachado = precio de lista
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

      // externalId: extraer SKU del href si existe, si no usar el path limpio
      const skuMatch = cleanHref.match(/\/(\d{5,})\/?$/);
      const externalId = skuMatch
        ? skuMatch[1]!
        : cleanHref.replace(/^\//, "").replace(/[/?#]/g, "_");

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

async function scrapeCategory(page: Page, category: string): Promise<ExtractedProduct[]> {
  const url = `${BASE_URL}/${category}`;
  console.log(`  → ${url}`);

  const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  if (!res || !res.ok()) {
    console.log(`    HTTP ${res?.status()} — skip`);
    return [];
  }

  // Esperar a que aparezcan productos — cualquier link a /tienda/product o SKU numérico
  try {
    await page.waitForFunction(
      () => {
        const links = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[];
        return links.filter((a) => {
          const h = a.getAttribute("href") ?? "";
          return /\/tienda\/product\//i.test(h) || /\/\d{5,}\/?$/.test(h);
        }).length >= 3;
      },
      { timeout: 30_000 },
    );
  } catch {
    // Lider puede no tener esa ruta — intentar con algún selector de precio
    try {
      await page.waitForFunction(
        () => document.body.innerText.match(/\$\s?\d{1,3}(\.\d{3})+/) !== null,
        { timeout: 15_000 },
      );
    } catch {
      console.log(`    sin productos — skip`);
      return [];
    }
  }

  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1500);

  const products = await extractFromPage(page);
  console.log(`    ✓ ${products.length} productos`);
  return products;
}

async function persistProducts(products: ExtractedProduct[]) {
  const chain = await prisma.chain.findUnique({ where: { slug: "lider" } });
  if (!chain) throw new Error("Cadena 'lider' no existe; corre el seed primero");

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

  console.log("\n=== LÍDER ===");
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

  console.log(`✓ lider: ${total} productos persistidos`);
  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
