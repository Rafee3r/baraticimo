import { VtexClient } from "./client.js";
import { persistVtexProducts } from "./persist.js";
import { prisma } from "../db.js";

const BASE_URL = "https://www.jumbo.cl";

/**
 * Categorías top de Jumbo para el MVP. Los IDs se obtienen una vez
 * desde /api/catalog_system/pub/category/tree/3 y se hardcodean aquí.
 * TODO: cargar dinamicamente y mantener actualizado.
 */
const CATEGORIES = [
  "despensa",
  "lacteos-y-quesos",
  "bebidas",
  "snacks-y-confites",
  "frutas-y-verduras",
];

async function main() {
  const argLimit = process.argv.find((a) => a.startsWith("--limit="));
  const limit = argLimit ? Number(argLimit.split("=")[1]) : 200;

  const client = new VtexClient(BASE_URL);
  console.log(`Scraping Jumbo (max ${limit} productos por categoría)`);

  let total = 0;
  for (const cat of CATEGORIES) {
    try {
      console.log(`  → categoría: ${cat}`);
      const products = await client.searchByQuery(cat, 0, Math.min(limit, 49));
      const saved = await persistVtexProducts({
        chainSlug: "jumbo",
        baseUrl: BASE_URL,
        products,
      });
      total += saved;
      console.log(`    guardados: ${saved}`);
    } catch (err) {
      console.error(`    error en ${cat}:`, err);
    }
  }

  console.log(`\n✓ Total guardado: ${total}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
