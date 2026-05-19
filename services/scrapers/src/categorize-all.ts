/**
 * Categoriza todos los ChainProduct sin categoría asignada usando DeepSeek.
 *
 * Procesa en batches de 80 productos por llamada (aprovecha el context
 * window grande). Persiste el campo `category` en la DB.
 *
 * Uso:
 *   pnpm --filter @baraticimo/scrapers categorize         # solo no categorizados
 *   pnpm --filter @baraticimo/scrapers categorize --all   # re-categoriza todo
 *   pnpm --filter @baraticimo/scrapers categorize --limit=500  # tope
 */
import { prisma } from "./db.js";
import { batchCategorize, type ProductCategory } from "./ai/deepseek.js";

const BATCH_SIZE = 80;

async function main() {
  const all = process.argv.includes("--all");
  const argLimit = process.argv.find((a) => a.startsWith("--limit="));
  const limit = argLimit ? Number(argLimit.split("=")[1]) : Infinity;

  console.log(`\n=== CATEGORIZAR PRODUCTOS ${all ? "(TODO)" : "(solo sin categoría)"} ===`);

  // Traer productos sin categoría (o todos si --all)
  const products = await prisma.chainProduct.findMany({
    where: all ? {} : { category: null },
    select: { id: true, name: true, brand: true },
    orderBy: { lastSeenAt: "desc" },
    take: limit === Infinity ? undefined : limit,
  });

  console.log(`Total a categorizar: ${products.length}`);
  if (products.length === 0) {
    console.log("Nada que hacer.");
    await prisma.$disconnect();
    return;
  }

  let totalDone = 0;
  let totalErrors = 0;
  const startedAt = Date.now();

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const batchInputs = batch.map((p, idx) => ({
      idx,
      name: p.name,
      brand: p.brand,
    }));

    process.stdout.write(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(products.length / BATCH_SIZE)} (${batch.length} productos)… `);

    try {
      const categoryMap = await batchCategorize(batchInputs);

      // Persistir en paralelo
      await Promise.all(
        batch.map((p, idx) => {
          const category = categoryMap.get(idx);
          if (!category) return null;
          return prisma.chainProduct.update({
            where: { id: p.id },
            data: { category },
          });
        }).filter(Boolean),
      );

      totalDone += categoryMap.size;
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
      console.log(`✓ ${categoryMap.size}/${batch.length} clasificados (${totalDone} total, ${elapsed}s)`);
    } catch (err) {
      totalErrors++;
      console.log(`✗ error: ${(err as Error).message}`);
    }
  }

  // Resumen por categoría
  const grouped = await prisma.chainProduct.groupBy({
    by: ["category"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  console.log(`\n=== RESUMEN ===`);
  console.log(`Clasificados: ${totalDone}`);
  console.log(`Errores: ${totalErrors}`);
  console.log(`\nProductos por categoría:`);
  for (const g of grouped) {
    console.log(`  ${(g.category ?? "(null)").padEnd(20)} ${g._count.id}`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
