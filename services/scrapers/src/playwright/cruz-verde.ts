/**
 * Scraper de Cruz Verde (cruzverde.cl).
 *
 * Cruz Verde usa su propia plataforma. Detectamos productos por links
 * que apuntan a páginas de producto (/producto/<slug> o patrones similares)
 * y extraemos precio con regex "$X.XXX".
 */
import { chromium, type Page } from "playwright";
import { prisma } from "../db.js";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const BASE_URL = "https://www.cruzverde.cl";

// Categorías reales en cruzverde.cl (verificadas con Playwright)
const CATEGORIES = [
  "dermocosmetica",
  "infantil-y-mama",
  "vitaminas-y-suplementos",
  "higiene-y-cuidado-personal",
  "cuidado-de-la-piel",
  "ofertas/ofertas-imperdibles",
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
    // Cruz Verde: links de producto terminan en /<sku>.html
    const productHrefRe = /\/\d{4,}\.html$/i;

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

      // Buscar la card del producto subiendo hasta 6 niveles
      let card: HTMLElement = link;
      for (let i = 0; i < 6; i++) {
        if (card.parentElement) card = card.parentElement;
        if (card.querySelector("img") && /\$\s?[\d.,]+/.test(card.textContent ?? "")) break;
      }

      const textNodes = Array.from(card.querySelectorAll("*"))
        .map((el) => el.textContent?.trim() ?? "")
        .filter((t) => t.length > 8 && t.length < 200 && !/^\$/.test(t) && !/^\d+$/.test(t));
      const name = textNodes.sort((a, b) => b.length - a.length)[0];
      if (!name) continue;

      const allText = card.textContent ?? "";
      const allPrices = Array.from(allText.matchAll(/\$\s?[\d.,]+/g))
        .map((m) => parsePrice(m[0]))
        .filter((v): v is number => v !== null && v > 100);
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
      // Cruz Verde: el SKU es el último número antes de .html
      const skuMatch = cleanHref.match(/\/(\d{4,})\.html/);
      const externalId = skuMatch ? skuMatch[1]! : cleanHref.replace(/^\//, "").replace(/[/?#]/g, "_");

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
        () => Array.from(document.querySelectorAll('a[href]')).filter((a) => /\/\d{4,}\.html$/i.test(a.getAttribute('href') ?? '')).length >= 3,
        { timeout: 30_000 },
      );
    } catch {
      try {
        await page.waitForFunction(
          () => document.body.innerText.match(/\$\s?\d{1,3}(\.\d{3})+/) !== null,
          { timeout: 15_000 },
        );
      } catch {
        console.log(`    sin productos — stop pagination`);
        break;
      }
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
  const chain = await prisma.chain.findUnique({ where: { slug: "cruz-verde" } });
  if (!chain) throw new Error("Cadena 'cruz-verde' no existe; corre el seed primero");

  let saved = 0;
  for (const p of products) {
    const productUrl = p.url.startsWith("http") ? p.url : `${BASE_URL}${p.url}`;
    const cp = await prisma.chainProduct.upsert({
      where: { chainId_externalId: { chainId: chain.id, externalId: p.externalId } },
      create: { chainId: chain.id, externalId: p.externalId, name: p.name, url: productUrl, imageUrl: p.imageUrl, isOnlineOnly: p.isOnlineOnly },
      update: { name: p.name, url: productUrl, imageUrl: p.imageUrl, isOnlineOnly: p.isOnlineOnly, lastSeenAt: new Date() },
    });
    await prisma.price.create({
      data: { chainProductId: cp.id, storeId: null, price: p.price, listPrice: p.listPrice, isOnSale: p.isOnSale, source: "PLAYWRIGHT" },
    });
    saved++;
  }
  return saved;
}

async function main() {
  const argLimit = process.argv.find((a) => a.startsWith("--limit="));
  const limit = argLimit ? Number(argLimit.split("=")[1]) : 999;

  console.log("\n=== CRUZ VERDE ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: USER_AGENT, viewport: { width: 1280, height: 900 }, locale: "es-CL" });
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

  console.log(`✓ cruz-verde: ${total} productos persistidos`);
  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
