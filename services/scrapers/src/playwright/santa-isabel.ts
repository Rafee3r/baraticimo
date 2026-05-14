/**
 * Scraper de Santa Isabel (Cencosud, misma estructura que Jumbo).
 */
import { scrapeCencosud } from "./cencosud.js";
import { prisma } from "../db.js";

const CATEGORIES = [
  // Alimentación básica
  "despensa",
  "lacteos-y-quesos",
  "lacteos",
  "frutas-y-verduras",
  "carnes-y-aves",
  "cecinas",
  "pescados-y-mariscos",
  "panaderia-y-pasteleria",
  // Bebidas
  "bebidas",
  // Otras comidas
  "congelados",
  "snacks-dulces-y-chocolates",
  "desayuno-y-cereales",
  // Hogar
  "limpieza",
  "belleza-y-cuidado-personal",
  "mascotas",
  "bebes",
];

async function main() {
  const argLimit = process.argv.find((a) => a.startsWith("--limit="));
  const limit = argLimit ? Number(argLimit.split("=")[1]) : 999;

  await scrapeCencosud(
    {
      chainSlug: "santa-isabel",
      baseUrl: "https://www.santaisabel.cl",
      categories: CATEGORIES,
    },
    limit,
  );
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
