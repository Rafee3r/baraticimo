/**
 * Scraper de Tottus (VTEX IO — distinto al Cencosud clásico).
 *
 * Tottus usa VTEX IO con clases dinámicas (hash en el nombre de clase),
 * así que usamos selectores semánticos robustos:
 * — productos por links que terminan en /p
 * — nombre por el texto más largo en cada card
 * — precio por patrones "$X.XXX" dentro de la card
 */
import { chromium, type Page } from "playwright";
import { prisma } from "../db.js";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const BASE_URL = "https://www.tottus.cl";

// Tottus usa URLs estilo /tottus-cl/lista/CATG<id>/<name>
// Los IDs CATG son numéricos y específicos por categoría
const CATEGORIES = [
  "tottus-cl/lista/CATG27055/Despensa",
  "tottus-cl/lista/CATG27139/Lacteos-y-Quesos",
  "tottus-cl/lista/CATG24752/Liquidos",
  "tottus-cl/lista/CATG27070/Frutas-y-Verduras",
  "tottus-cl/lista/CATG27069/Carnes",
  "tottus-cl/lista/CATG27073/Congelados",
  "tottus-cl/lista/CATG27142/Pasteleria",
  "tottus-cl/lista/CATG27074/Aseo-y-Limpieza",
  "tottus-cl/lista/CATG24761/Mascotas",
  "tottus-cl/lista/CATG24802/Panales-y-Toallas-Humedas",
  "tottus-cl/lista/CATG27084/Vinos-y-Licores",
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
    // Tottus: /tottus-cl/articulo/<id1>/<slug>/<id2>
    const productHrefRe = /\/tottus-cl\/articulo\//i;

    function parsePrice(s: string): number | null {
      const m = s.match(/\$\s?([\d.,]+)/);
      if (!m) return null;
      const clean = m[1]!.replace(/\./g, "").replace(/,(\d{2})$/, ".$1").replace(/,/g, "");
      const n = parseFloat(clean);
      return isFinite(n) && n > 0 ? Math.round(n) : null;
    }

    // Encontrar todos los links a páginas de producto
    const allLinks = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[];
    const productLinks = allLinks.filter((a) => {
      const href = a.getAttribute("href") ?? "";
      return productHrefRe.test(href) && href.length > 4;
    });

    const seen = new Set<string>();
    const out: ExtractedProduct[] = [];

    for (const link of productLinks) {
      const href = link.getAttribute("href")!;
      // Normalizar: quitar query params para dedup
      const cleanHref = href.split("?")[0]!;
      if (seen.has(cleanHref)) continue;

      // Buscar el contenedor de la card (hasta 6 niveles arriba)
      let card: HTMLElement = link;
      for (let i = 0; i < 6; i++) {
        if (card.parentElement) card = card.parentElement;
        // Heurística: si el contenedor tiene imagen Y texto de precio, es la card
        if (card.querySelector("img") && /\$\s?[\d.,]+/.test(card.textContent ?? "")) break;
      }

      // Nombre: el texto más largo dentro del link (o la card) que no sea precio
      const textNodes = Array.from(card.querySelectorAll("*"))
        .map((el) => el.textContent?.trim() ?? "")
        .filter((t) => t.length > 8 && t.length < 200 && !/^\$/.test(t) && !/^\d+$/.test(t));
      const name = textNodes.sort((a, b) => b.length - a.length)[0];
      if (!name) continue;

      // Precios: todos los "$X.XXX" dentro de la card
      const allText = card.textContent ?? "";
      const allPrices = Array.from(allText.matchAll(/\$\s?[\d.,]+/g))
        .map((m) => parsePrice(m[0]))
        .filter((v): v is number => v !== null && v > 100); // filtrar precios irreales

      if (allPrices.length === 0) continue;

      // Detectar precio tachado (precio de lista / normal)
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

      // Imagen
      const img = card.querySelector("img");
      const imageUrl =
        img?.getAttribute("src") ?? img?.getAttribute("data-src") ?? null;

      seen.add(cleanHref);
      // Tottus: /tottus-cl/articulo/<id1>/<slug>/<id2> → id externo = id1
      const idMatch = cleanHref.match(/\/articulo\/(\d+)/);
      const externalId = idMatch
        ? idMatch[1]!
        : cleanHref.replace(/^\//, "").replace(/[/?#]/g, "_");

      out.push({
        externalId,
        url: cleanHref,
        name: name.slice(0, 255),
        price,
        listPrice,
        isOnSale: listPrice !== null && listPrice > price,
        imageUrl,
        isOnlineOnly: false, // Tottus no distingue en la lista
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

async function scrapeCategory(
  page: Page,
  category: string,
): Promise<ExtractedProduct[]> {
  const MAX_PAGES = 8;
  const all: ExtractedProduct[] = [];
  const seen = new Set<string>();

  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    // Tottus exige &store=to_com en TODAS las páginas (incluso p1)
    // sino devuelve 403 para p2+
    const url = `${BASE_URL}/${category}?page=${pageNum}&store=to_com`;
    console.log(`  → ${url}`);

    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (!res || !res.ok()) {
      console.log(`    HTTP ${res?.status()} — stop pagination`);
      break;
    }

    try {
      await page.waitForFunction(
        () => document.querySelectorAll('a[href*="/articulo/"]').length >= 3,
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
  const chain = await prisma.chain.findUnique({ where: { slug: "tottus" } });
  if (!chain) throw new Error("Cadena 'tottus' no existe; corre el seed primero");

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

  console.log("\n=== TOTTUS ===");
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

  console.log(`✓ tottus: ${total} productos persistidos`);
  await browser.close();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
