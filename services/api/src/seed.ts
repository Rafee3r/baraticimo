import { prisma } from "./db.js";
import { CHILE_COMUNAS } from "./data/comunas.js";
import { CHAINS } from "./data/chains.js";

async function main() {
  console.log("Seeding chains...");
  for (const chain of CHAINS) {
    await prisma.chain.upsert({
      where: { slug: chain.slug },
      create: chain,
      update: chain,
    });
  }
  console.log(`  ✓ ${CHAINS.length} chains`);

  console.log("Seeding comunas...");
  for (const c of CHILE_COMUNAS) {
    await prisma.comuna.upsert({
      where: { code: c.code },
      create: c,
      update: c,
    });
  }
  console.log(`  ✓ ${CHILE_COMUNAS.length} comunas`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
