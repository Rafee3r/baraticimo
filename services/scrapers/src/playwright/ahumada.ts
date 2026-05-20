/**
 * Scraper de Farmacias Ahumada (farmaciasahumada.cl).
 */
import { chromium, type Page } from "playwright";
import { prisma } from "../db.js";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const BASE_URL = "https://www.farmaciasahumada.cl";

// Categorías reales (verificadas con Playwright) — Ahumada usa slugs sin prefijo
const CATEGORIES = [
  "medicamentos",
  "medicamentos/diabetes",
  "medicamentos/sistema-nervioso",
  "medicamentos/anticonceptivos-y-hormonas",
  "dermocosmetica",
  "dermocosmetica/rostro",
  "dermocosmetica/cuerpo",
  "dermocosmetica/proteccion-solar",
  "vitaminas-y-suplementos",
  "infantil-y-mama",
  "cuidado-personal",
  "higiene-y-cuidado-personal",
  "cuidado-de-la-salud",
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
    // Ahumada usa /farmacias/<slug> o /p/<id> según la sección
    // Ahumada: productos terminan en /<slug>-<sku>.html
    const productHrefRe = /-\d{4,}\.html$/i;
    const skuHrefRe = /-\d{4,}\.html$/i;

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

      let card: HTMLElement = link;
      for (let i = 0; i < 6; i++) {
        if (card.parentElement) card = card.parentElement;
        if (card.querySelector("img") && /\$\s?[\d.,]+/.test(card.textContent ?? "")) break;
      }

      let name: string | undefined;
      const nameEl = card.querySelector('h2, h3, h4, [class*="name" i]:not(button), [class*="title" i]:not(button)');
      if (nameEl) {
        const t = (nameEl.textContent ?? "").trim();
        if (t.length > 5 && t.length < 200 && !/\$\s?\d/.test(t) && !/-\d+%/.test(t)) name = t;
      }
      if (!name) {
        const textNodes = Array.from(card.querySelectorAll("*"))
          .map((el) => el.textContent?.trim() ?? "")
          .filter((t) =>
            t.length > 8 && t.length < 200 &&
            !/^\$/.test(t) && !/^\d+$/.test(t) &&
            !/\$\s?\d/.test(t) && !/-\d+\s*%/.test(t) &&
            !/venta\s+directa/i.test(t) && !/formato\s*:/i.test(t) &&
            !/precio\s*\w*\s*:/i.test(t)
          );
        name = textNodes.sort((a, b) => b.length - a.length)[0];
      }
      if (!name) continue;
      name = name
        .replace(/\s*venta\s+directa.*$/i, "")
        .replace(/\s*formato\s*:.*$/i, "")
        .replace(/\s*precio\s*\w*\s*:.*$/i, "")
        .replace(/\s*\$\s?\d[\d.,]*.*$/, "")
        .replace(/\s*-\d+\s*%.*$/, "")
        .trim();
      if (name.length < 5) continue;

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
      // Ahumada: SKU es el último número antes de .html (ej: serum-foo-93545.html → 93545)
      const skuMatch = cleanHref.match(/-(\d{4,})\.html$/);
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
        () => document.body.innerText.match(/\$\s?\d{1,3}(\.\d{3})+/) !== null,
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
  const chain = await prisma.chain.findUnique({ where: { slug: "ahumada" } });
  if (!chain) throw new Error("Cadena 'ahumada' no existe; corre el seed primero");

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

  console.log("\n=== FARMACIAS AHUMADA ===");
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

  console.log(`✓ ahumada: ${total} productos persistidos`);
  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
