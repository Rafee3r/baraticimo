/**
 * Diagnostic: para cada producto del primer card, extraer cada nodo
 * que contenga "$" y su class — para identificar la clase del precio
 * principal vs. el unitario.
 */
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "es-CL",
  });
  const page = await ctx.newPage();
  await page.addInitScript(`window.__name = (fn) => fn;`);

  // Una página con packs (donde aparecen precios unitarios)
  await page.goto("https://www.jumbo.cl/limpieza", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector('[class*="product-card-name"]', { timeout: 30_000 });
  await page.waitForTimeout(3000);

  const diag = await page.evaluate(() => {
    const nameEls = document.querySelectorAll('[class*="product-card-name"]');
    const out: any[] = [];
    for (let i = 0; i < Math.min(3, nameEls.length); i++) {
      const el = nameEls[i]!;
      let a: HTMLElement | null = el as HTMLElement;
      while (a && a.tagName !== "A") a = a.parentElement;
      if (!a) continue;
      const allEls = Array.from(a.querySelectorAll("*")) as HTMLElement[];
      const priceNodes = allEls
        .filter((e) => {
          const t = e.textContent ?? "";
          // Solo nodos hoja con texto que contiene $
          return /\$/.test(t) && e.children.length === 0;
        })
        .map((e) => ({
          text: (e.textContent ?? "").trim().substring(0, 40),
          tag: e.tagName.toLowerCase(),
          cls: (e.className || "").substring(0, 100),
          parentCls: (e.parentElement?.className || "").substring(0, 100),
        }));
      out.push({
        name: el.textContent?.trim().substring(0, 50),
        prices: priceNodes,
      });
    }
    return out;
  });

  console.log(JSON.stringify(diag, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
