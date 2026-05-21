/**
 * Scraper genérico para retailers Cencosud (Jumbo, Santa Isabel).
 * Mismo stack frontend, misma estructura DOM, sólo cambia el dominio
 * y la lista de categorías.
 */
import { chromium, type Page } from "playwright";
import { prisma } from "../db.js";
import { batchMatchProducts } from "../ai/deepseek.js";

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

      // Detectar precios de referencia por unidad/kg para excluirlos del precio principal.
      // Ej: "$1.990 /kg", "$890 c/u" — no es el precio del producto.
      const cardText = a.textContent ?? "";
      const perUnitRe = /\$\s?[\d.,]+\s*\/\s*(kg|kilo|gr?|ml|lt?|un|unidad|c\/u|c\.u)/gi;
      const perUnitSet = new Set<number>(
        Array.from(cardText.matchAll(perUnitRe))
          .map((m) => parsePrice(m[0]))
          .filter((v): v is number => v !== null),
      );

      const priceContainers = Array.from(a.querySelectorAll("*")) as HTMLElement[];
      for (const node of priceContainers) {
        const cls = (node.className || "").toString();
        if (!cls.includes("font-bold") || !cls.includes("text-lg")) continue;

        const txt = node.textContent ?? "";
        const matches = Array.from(txt.matchAll(/\$\s?[\d.,]+/g)).map((m) => parsePrice(m[0]));
        // Excluir precios de referencia por unidad (precio/kg, c/u, etc.)
        const valid = matches.filter((v): v is number => v != null && !perUnitSet.has(v));
        if (valid.length === 0) continue;

        const struck = Array.from(node.querySelectorAll('[class*="line-through"]'))
          .map((e) => parsePrice(e.textContent ?? ""))
          .filter((v): v is number => v != null && !perUnitSet.has(v));

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

/** Scroll progresivo hasta el final, dando tiempo al lazy-load. */
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

async function scrapeCategory(page: Page, baseUrl: string, category: string): Promise<ExtractedProduct[]> {
  const MAX_PAGES = 5;
  const all: ExtractedProduct[] = [];
  const seen = new Set<string>();

  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    const url = pageNum === 1
      ? `${baseUrl}/${category}`
      : `${baseUrl}/${category}?page=${pageNum}`;
    console.log(`  → ${url}`);
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (!res || !res.ok()) {
      console.log(`    HTTP ${res?.status()} — stop pagination`);
      break;
    }
    try {
      await page.waitForSelector('[class*="product-card-name"]', { timeout: 30_000 });
    } catch {
      console.log(`    no product cards rendered — stop pagination`);
      break;
    }
    await page.waitForTimeout(2000);
    await autoScroll(page);

    const products = await extractFromPage(page);
    const fresh = products.filter((p) => !seen.has(p.externalId));
    fresh.forEach((p) => seen.add(p.externalId));
    all.push(...fresh);
    console.log(`    p${pageNum}: ${products.length} extraídos, ${fresh.length} nuevos`);

    // Si no hay productos nuevos en esta página, probablemente llegamos al final
    if (fresh.length === 0) break;
  }

  console.log(`    ✓ ${all.length} productos totales en ${category}`);
  return all;
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

  // ─── Batch cross-chain matching (post-scrape) ──────────────────────────────
  // Busca ChainProducts sin match canónico y los empareja en batches de 150.
  await runBatchMatcher(config.chainSlug);

  return total;
}

const BATCH_SIZE = 150;

async function runBatchMatcher(chainSlug: string) {
  try {
    // ChainProducts de esta cadena sin productId canónico
    const unmatched = await prisma.chainProduct.findMany({
      where: {
        chain: { slug: chainSlug },
        productId: null,
      },
      select: { id: true, name: true, brand: true, format: true },
      take: 500,
    });

    if (unmatched.length === 0) {
      console.log(`  matching: 0 productos sin match — nada que hacer`);
      return;
    }

    console.log(`  matching: ${unmatched.length} productos sin match canónico`);

    // Para cada unmatched, busca candidatos heurísticos en otras cadenas
    const pairs: {
      idx: number;
      cpId: string;
      a: { name: string; brand: string | null; format: string | null };
      candidates: { id: string; name: string; brand: string | null; format: string | null }[];
    }[] = [];

    for (let i = 0; i < unmatched.length; i++) {
      const cp = unmatched[i]!;
      const words = cp.name
        .toLowerCase()
        .replace(/[^\wáéíóúñ\s]/gi, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4)
        .sort((a, b) => b.length - a.length)
        .slice(0, 3);

      if (words.length < 2) continue;

      const candidates = await prisma.chainProduct.findMany({
        where: {
          chain: { slug: { not: chainSlug } },
          AND: words.map((w) => ({ name: { contains: w, mode: "insensitive" as const } })),
        },
        select: { id: true, name: true, brand: true, format: true },
        take: 4,
      });

      if (candidates.length > 0) {
        pairs.push({
          idx: i,
          cpId: cp.id,
          a: { name: cp.name, brand: cp.brand, format: cp.format },
          candidates,
        });
      }
    }

    if (pairs.length === 0) {
      console.log(`  matching: sin candidatos encontrados`);
      return;
    }

    // Procesar en batches de 150
    let matched = 0;
    for (let start = 0; start < pairs.length; start += BATCH_SIZE) {
      const batch = pairs.slice(start, start + BATCH_SIZE).map((p, localIdx) => ({
        idx: localIdx,
        a: p.a,
        candidates: p.candidates,
      }));

      const results = await batchMatchProducts(batch);

      for (const [localIdx, match] of results) {
        const pair = pairs[start + localIdx];
        if (!pair) continue;

        // Asegura que exista un Product canónico con ese ID
        const targetCp = await prisma.chainProduct.findUnique({
          where: { id: match.productId },
          select: { productId: true, name: true, brand: true, format: true, imageUrl: true },
        });
        if (!targetCp) continue;

        let canonicalId = targetCp.productId;
        if (!canonicalId) {
          // Crear nuevo producto canónico desde el target
          const newProduct = await prisma.product.create({
            data: {
              name: targetCp.name,
              brand: targetCp.brand,
              format: targetCp.format,
              imageUrl: targetCp.imageUrl,
            },
          });
          canonicalId = newProduct.id;
          await prisma.chainProduct.update({
            where: { id: match.productId },
            data: { productId: canonicalId, matchConfidence: 1.0 },
          });
        }

        // Vincular el unmatched al mismo producto canónico
        await prisma.chainProduct.update({
          where: { id: pair.cpId },
          data: { productId: canonicalId, matchConfidence: match.confidence },
        });
        matched++;
      }
    }

    console.log(`  matching: ${matched}/${pairs.length} productos emparejados`);
  } catch (err) {
    console.warn(`  matching falló (no crítico):`, (err as Error).message);
  }
}
