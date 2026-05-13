/**
 * Scraper de Jumbo basado en Playwright.
 *
 * Estrategia: las APIs VTEX están bloqueadas, pero el HTML renderizado
 * funciona. Cada producto en la página es un <a href="/<slug>"> que
 * contiene un <... class="...product-card-name...">nombre</...> y un
 * texto con $precio. Renderizamos la categoría, extraemos los productos,
 * y persistimos en Postgres.
 */
import { chromium, type Page } from "playwright";
import { prisma } from "../db.js";

const BASE = "https://www.jumbo.cl";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

// Categorías cuyo URL funciona al 2026-05-13. Jumbo cambia los slugs de
// vez en cuando, así que esto necesita revisión periódica.
const CATEGORIES = [
  "despensa",
  "lacteos-y-quesos",
  "frutas-y-verduras",
  "congelados",
  "limpieza",
  "belleza-y-cuidado-personal",
  "mascotas",
];

interface ExtractedProduct {
  externalId: string; // slug
  url: string;
  name: string;
  price: number;
  listPrice: number | null;
  isOnSale: boolean;
  imageUrl: string | null;
}

async function extractFromPage(page: Page): Promise<ExtractedProduct[]> {
  // Nota: el código dentro de evaluate corre en el browser, sin tipos TS.
  // Evitamos named arrow helpers porque tsx añade un wrapper __name() que
  // no existe en el contexto del browser.
  return page.evaluate(() => {
    // Producto: <a href="/slug-de-producto/p"> con un <... class="product-card-name"> dentro.
    const productHrefRe = /^\/[a-z0-9][a-z0-9-]+\/p\/?$/i;

    function parsePrice(s: string) {
      const m = s.match(/\$\s?([\d.,]+)/);
      if (!m) return null;
      const clean = m[1]!.replace(/\./g, "").replace(/,/g, ".");
      const n = parseFloat(clean);
      return isFinite(n) ? Math.round(n) : null;
    }

    // Estrategia: empezar desde cada nombre y subir hasta el <a href>
    const nameEls = Array.from(document.querySelectorAll('[class*="product-card-name"]'));
    const seen = new Set<string>();
    const out: ExtractedProduct[] = [];

    for (const nameEl of nameEls) {
      const name = nameEl.textContent?.trim();
      if (!name || name.length < 4) continue;

      // Subir hasta el <a> ancestro
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

      // Estructura Jumbo:
      //   <div class="...font-bold text-lg...">  ← contenedor del precio principal
      //     <span class="line-through ...">$12.200</span>   ← precio normal (cuando hay oferta)
      //     $11.500                                          ← precio actual (texto pelado del div)
      //   </div>
      //   <div class="ppum-price-container">$X.XXX x kg</div>   ← precio unitario (ignorar)
      //   <div class="bg-bgflagoferta">Lleva N por $X</div>     ← promo de pack (ignorar)
      let price: number | null = null;
      let listPrice: number | null = null;

      const priceContainers = Array.from(a.querySelectorAll("*")) as HTMLElement[];
      for (const node of priceContainers) {
        const cls = (node.className || "").toString();
        if (!cls.includes("font-bold") || !cls.includes("text-lg")) continue;

        // El contenedor del precio principal. Sacar todos los $ que tenga.
        const txt = node.textContent ?? "";
        const matches = Array.from(txt.matchAll(/\$\s?[\d.,]+/g)).map((m) => parsePrice(m[0]));
        const valid = matches.filter((v): v is number => v != null);
        if (valid.length === 0) continue;

        // El precio "tachado" (line-through) es el precio de lista
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

      const img = a.querySelector("img")?.getAttribute("src") ?? null;

      seen.add(href);
      // externalId = slug sin "/" y sin "/p"
      const externalId = href.replace(/^\//, "").replace(/\/p\/?$/, "");
      out.push({
        externalId,
        url: href,
        name,
        price,
        listPrice: listPrice && listPrice > price ? listPrice : null,
        isOnSale: listPrice != null && listPrice > price,
        imageUrl: img,
      });
    }

    return out;
  });
}

async function scrapeCategory(page: Page, category: string): Promise<ExtractedProduct[]> {
  const url = `${BASE}/${category}`;
  console.log(`  → ${url}`);
  const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  if (!res || !res.ok()) {
    console.log(`    HTTP ${res?.status()} — skip`);
    return [];
  }
  try {
    await page.waitForSelector('[class*="product-card-name"]', { timeout: 30_000 });
  } catch {
    console.log(`    no product cards rendered in time — skip`);
    return [];
  }
  // Let lazy-loaded prices settle
  await page.waitForTimeout(2500);
  // Scroll a bit to trigger lazy loading
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(1500);

  const products = await extractFromPage(page);
  console.log(`    ✓ ${products.length} productos extraídos`);
  return products;
}

async function persistProducts(products: ExtractedProduct[]) {
  const chain = await prisma.chain.findUnique({ where: { slug: "jumbo" } });
  if (!chain) throw new Error("Cadena 'jumbo' no existe; corre el seed primero");
  let saved = 0;
  for (const p of products) {
    const productUrl = p.url.startsWith("http") ? p.url : `${BASE}${p.url}`;
    const cp = await prisma.chainProduct.upsert({
      where: { chainId_externalId: { chainId: chain.id, externalId: p.externalId } },
      create: {
        chainId: chain.id,
        externalId: p.externalId,
        name: p.name,
        url: productUrl,
        imageUrl: p.imageUrl,
      },
      update: { name: p.name, url: productUrl, imageUrl: p.imageUrl, lastSeenAt: new Date() },
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

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1280, height: 800 },
    locale: "es-CL",
  });
  const page = await context.newPage();
  // tsx/esbuild añade un wrapper __name() a funciones; lo definimos no-op
  // en el contexto del browser para que las funciones serializadas funcionen.
  await page.addInitScript(`window.__name = (fn) => fn;`);

  let totalSaved = 0;
  for (const cat of CATEGORIES) {
    try {
      const products = await scrapeCategory(page, cat);
      const sliced = products.slice(0, limit);
      const saved = await persistProducts(sliced);
      totalSaved += saved;
    } catch (err) {
      console.error(`  ✗ error en ${cat}:`, (err as Error).message);
    }
  }

  console.log(`\n✓ Total persistido: ${totalSaved}`);
  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
