/**
 * Probe Líder con Queue-It
 */
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "es-CL",
  });
  const page = await ctx.newPage();
  await page.addInitScript(`window.__name = (fn) => fn;`);

  // Aceptar mucho tiempo de espera por Queue-It
  const targetUrl = process.argv[2] ?? "https://www.santaisabel.cl/despensa";
  console.log(`Navegando a ${targetUrl}...`);
  const start = Date.now();
  try {
    const res = await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    console.log(`HTTP ${res?.status()} en ${((Date.now() - start) / 1000).toFixed(1)}s`);
    console.log(`Final URL: ${page.url()}`);
    console.log(`Title: ${await page.title()}`);

    // Wait a bit for content
    await page.waitForTimeout(5000);
    const finalUrl = page.url();
    console.log(`After wait: ${finalUrl}`);

    if (finalUrl.includes("queue-it")) {
      console.log("⚠ Aún en queue-it, salimos");
      await browser.close();
      return;
    }

    // Save HTML for inspection
    const html = await page.content();
    const fs = await import("fs");
    fs.writeFileSync("/tmp/lider-render.html", html);
    console.log(`HTML size: ${html.length}`);

    // Look for products
    const selectors = await page.evaluate(() => {
      const patterns: Record<string, number> = {};
      for (const sel of [
        'a[href*="/product/"]',
        'a[href*="/sku/"]',
        '[data-testid*="product"]',
        '[class*="product-card"]',
        '[class*="ProductCard"]',
        '[class*="ProductPod"]',
        '[class*="ItemList"]',
      ]) {
        const n = document.querySelectorAll(sel).length;
        if (n) patterns[sel] = n;
      }
      // Show all <a href> patterns
      const linkPatterns: Record<string, number> = {};
      const links = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[];
      for (const a of links) {
        const h = a.getAttribute("href") || "";
        const prefix = h.split("/").slice(0, 3).join("/").substring(0, 50);
        if (prefix.startsWith("/")) linkPatterns[prefix] = (linkPatterns[prefix] ?? 0) + 1;
      }
      return { patterns, topLinks: Object.entries(linkPatterns).sort(([, a], [, b]) => b - a).slice(0, 10) };
    });
    console.log("\nProduct selectors:", selectors.patterns);
    console.log("Top link prefixes:", selectors.topLinks);
  } catch (e) {
    console.error("Error:", (e as Error).message);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
