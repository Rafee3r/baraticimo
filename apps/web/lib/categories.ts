// Categorías visibles en el home con su emoji y palabra clave para
// buscar productos relacionados. No corresponde 1:1 con las categorías
// internas de cada cadena — es un mapa de navegación al usuario final.

export interface Category {
  slug: string;
  name: string;
  emoji: string;
  keyword: string; // término que pasamos a /buscar?q=...
}

export const CATEGORIES: Category[] = [
  { slug: "despensa", name: "Despensa", emoji: "🛒", keyword: "arroz" },
  { slug: "lacteos", name: "Lácteos", emoji: "🥛", keyword: "leche" },
  { slug: "carnes", name: "Carnes", emoji: "🥩", keyword: "carne" },
  { slug: "frutas-verduras", name: "Frutas y verduras", emoji: "🥬", keyword: "tomate" },
  { slug: "bebidas", name: "Bebidas", emoji: "🥤", keyword: "bebida" },
  { slug: "snacks", name: "Snacks", emoji: "🍪", keyword: "galleta" },
  { slug: "limpieza", name: "Limpieza", emoji: "🧴", keyword: "detergente" },
  { slug: "belleza", name: "Belleza", emoji: "💄", keyword: "shampoo" },
  { slug: "bebes", name: "Bebés", emoji: "👶", keyword: "pañal" },
  { slug: "mascotas", name: "Mascotas", emoji: "🐾", keyword: "perro" },
];
