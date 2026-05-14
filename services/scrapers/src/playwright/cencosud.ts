/**
 * Scraper genérico para retailers Cencosud (Jumbo, Santa Isabel).
 * Mismo stack frontend, misma estructura DOM, sólo cambia el dominio
 * y la lista de categorías.
 */
import { chromium, type Page } from "playwright";
import { prisma } from "../db.js";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

export interface CencosudConfig {
  chainSlug: string; // "jumbo" | "santa-isabel"
  baseUrl: string; // "https://www.jumbo.cl"
  categories: string[]; // slugs sin "/"
}

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
    const productHrefRe = /^\/[a-z0-9][a-z0-9-]+\/p\/?$/i;

    function parsePrice(s: string) {
      const m = s.match(/\$\s?([\d.,]+)/);
      if (!m) return null;
      const clean = m[1]!.replace(/\./g, "").replace(/,/g, ".");
      const n = parseFloat(clean);
      return isFinite(n) ? Math.round(n) : null;
    }

    const nameEls = Array.from(document.querySelectorAll('[class*="product-card-name"]'));
    const seen = new Set<string>();
    const out: ExtractedProduct[] = [];

    for (const nameEl of nameEls) {
      const name = nameEl.textContent?.trim();
      if (!name || name.length < 4) continue;

      let node: HTMLElement | null = nameEl as HTMLElement;
      let a: HTMLAnchorElement | null = null;
      while (node && !a) {
        if (node.tagName === "A") a = node as HTMLAnchorElement;
        node = node.parentElement;
      }
      if (!a) continue;
      const href = a.getAttribute("href") ?? "";
      if (!productHrefRe.test(href)) continue;
      if (seen.has(href)) continue;

      let price: number | null = null;
      let listPrice: number | null = null;

      const priceContainers = Array.from(a.querySelectorAll("*")) as HTMLElement[];
      for (const node of priceContainers) {
        const cls = (node.className || "").toString();
        if (!cls.includes("font-bold") || !cls.includes("text-lg")) continue;

        const txt = node.textContent ?? "";
        const matches = Array.from(txt.matchAll(/\$\s?[\d.,]+/g)).map((m) => parsePrice(m[0]));
        const valid = matches.filter((v): v is number => v != null);
        if (valid.length === 0) continue;

        const struck = Array.from(node.querySelectorAll('[class*="line-through"]'))
          .map((e) => parsePrice(e.textContent ?? ""))
          .filter((v): v is number => v != null);

        if (struck.length > 0) {
          listPrice = Math.max(...struck);
          const others = valid.filter((v) => !struck.includes(v));
          price = others.length > 0 ? Math.min(...others) : Math.min(...valid);
        } else {
          price = Math.min(...valid);
        }
        break;
      }

      if (price == null) continue;

      let isOnlineOnly = false;
      const pills = a.querySelectorAll("p, span");
      for (const pill of Array.from(pills)) {
        if ((pill.textContent ?? "").trim() === "Exclusivo online") {
          isOnlineOnly = true;
          break;
        }
      }

      seen.add(href);
      const externalId = href.replace(/^\//, "").replace(/\/p\/?$/, "");
      out.push({
        externalId,
        url: href,
        isOnlineOnly,
        name,
        price,
        listPrice: listPrice && listPrice > price ? listPrice : null,
        isOnSale: listPrice != null && listPrice > price,
        imageUrl: a.querySelector("img")?.getAttribute("src") ?? null,
      });
    }

    return out;
  });
}

async function scrapeCategory(page: Page, baseUrl: string, category: string): Promise<ExtractedProduct[]> {
  const url = `${baseUrl}/${category}`;
  console.log(`  → ${url}`);
  const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  if (!res || !res.ok()) {
    console.log(`    HTTP ${res?.status()} — skip`);
    return [];
  }
  try {
    await page.waitForSelector('[class*="product-card-name"]', { timeout: 30_000 });
  } catch {
    console.log(`    no product cards rendered — skip`);
    return [];
  }
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1500);

  const products = await extractFromPage(page);
  console.log(`    ✓ ${products.length} productos extraídos`);
  return products;
}

async function persistProducts(chainSlug: string, baseUrl: string, products: ExtractedProduct[]) {
  const chain = await prisma.chain.findUnique({ where: { slug: chainSlug } });
  if (!chain) throw new Error(`Cadena '${chainSlug}' no existe; corre el seed primero`);

  let saved = 0;
  for (const p of products) {
    const productUrl = p.url.startsWith("http") ? p.url : `${baseUrl}${p.url}`;
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

export async function scrapeCencosud(config: CencosudConfig, limit: number) {
  console.log(`\n=== ${config.chainSlug.toUpperCase()} ===`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1280, height: 800 },
    locale: "es-CL",
  });
  const page = await context.newPage();
  // tsx/esbuild añade un wrapper __name() a funciones; lo definimos no-op
  // en el browser para que las funciones serializadas funcionen.
  await page.addInitScript(`window.__name = (fn) => fn;`);

  let total = 0;
  for (const cat of config.categories) {
    try {
      const products = await scrapeCategory(page, config.baseUrl, cat);
      const sliced = products.slice(0, limit);
      const saved = await persistProducts(config.chainSlug, config.baseUrl, sliced);
      total += saved;
    } catch (err) {
      console.error(`  ✗ error en ${cat}:`, (err as Error).message);
    }
  }

  console.log(`✓ ${config.chainSlug}: ${total} productos persistidos`);
  await browser.close();
  return total;
}
