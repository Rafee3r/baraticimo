// Datos de demostración. Reemplazar por llamadas tRPC reales cuando la DB esté lista.

export interface Chain {
  slug: string;
  name: string;
  kind: "Supermercado" | "Farmacia";
  color: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  format: string;
  category: string;
  emoji: string;
  prices: { chainSlug: string; price: number; isOnSale: boolean }[];
}

export const CHAINS: Chain[] = [
  { slug: "jumbo", name: "Jumbo", kind: "Supermercado", color: "#00873A" },
  { slug: "lider", name: "Líder", kind: "Supermercado", color: "#0071CE" },
  { slug: "santa-isabel", name: "Santa Isabel", kind: "Supermercado", color: "#E60028" },
  { slug: "tottus", name: "Tottus", kind: "Supermercado", color: "#FFB81C" },
  { slug: "unimarc", name: "Unimarc", kind: "Supermercado", color: "#003DA5" },
  { slug: "cruz-verde", name: "Cruz Verde", kind: "Farmacia", color: "#00A651" },
  { slug: "salcobrand", name: "Salcobrand", kind: "Farmacia", color: "#005DAA" },
  { slug: "ahumada", name: "Ahumada", kind: "Farmacia", color: "#E4002B" },
];

export const PRODUCTS: Product[] = [
  {
    id: "coca-cola-15",
    name: "Coca Cola Original 1.5L",
    brand: "Coca-Cola",
    format: "1.5 L",
    category: "Bebidas",
    emoji: "🥤",
    prices: [
      { chainSlug: "jumbo", price: 1890, isOnSale: false },
      { chainSlug: "lider", price: 1790, isOnSale: true },
      { chainSlug: "santa-isabel", price: 1990, isOnSale: false },
      { chainSlug: "tottus", price: 1850, isOnSale: false },
      { chainSlug: "unimarc", price: 1990, isOnSale: false },
    ],
  },
  {
    id: "leche-soprole",
    name: "Leche Entera Soprole 1L",
    brand: "Soprole",
    format: "1 L",
    category: "Lácteos",
    emoji: "🥛",
    prices: [
      { chainSlug: "jumbo", price: 1190, isOnSale: false },
      { chainSlug: "lider", price: 1090, isOnSale: false },
      { chainSlug: "santa-isabel", price: 1150, isOnSale: false },
      { chainSlug: "tottus", price: 1099, isOnSale: true },
      { chainSlug: "unimarc", price: 1190, isOnSale: false },
    ],
  },
  {
    id: "pan-ideal",
    name: "Pan de Molde Ideal Hogareño 500g",
    brand: "Ideal",
    format: "500 g",
    category: "Panadería",
    emoji: "🍞",
    prices: [
      { chainSlug: "jumbo", price: 2390, isOnSale: false },
      { chainSlug: "lider", price: 2290, isOnSale: false },
      { chainSlug: "santa-isabel", price: 2390, isOnSale: false },
      { chainSlug: "tottus", price: 2190, isOnSale: true },
      { chainSlug: "unimarc", price: 2450, isOnSale: false },
    ],
  },
  {
    id: "aceite-belmont",
    name: "Aceite Vegetal Belmont 1L",
    brand: "Belmont",
    format: "1 L",
    category: "Despensa",
    emoji: "🫒",
    prices: [
      { chainSlug: "jumbo", price: 1990, isOnSale: false },
      { chainSlug: "lider", price: 1890, isOnSale: false },
      { chainSlug: "santa-isabel", price: 1990, isOnSale: false },
      { chainSlug: "tottus", price: 1950, isOnSale: false },
      { chainSlug: "unimarc", price: 2090, isOnSale: false },
    ],
  },
  {
    id: "arroz-tucapel",
    name: "Arroz Grado 1 Tucapel 1kg",
    brand: "Tucapel",
    format: "1 kg",
    category: "Despensa",
    emoji: "🍚",
    prices: [
      { chainSlug: "jumbo", price: 1690, isOnSale: false },
      { chainSlug: "lider", price: 1590, isOnSale: false },
      { chainSlug: "santa-isabel", price: 1690, isOnSale: false },
      { chainSlug: "tottus", price: 1490, isOnSale: true },
      { chainSlug: "unimarc", price: 1750, isOnSale: false },
    ],
  },
  {
    id: "detergente-omo",
    name: "Detergente Líquido Omo Matic 1.5L",
    brand: "Omo",
    format: "1.5 L",
    category: "Limpieza",
    emoji: "🧼",
    prices: [
      { chainSlug: "jumbo", price: 7990, isOnSale: false },
      { chainSlug: "lider", price: 7490, isOnSale: true },
      { chainSlug: "santa-isabel", price: 7990, isOnSale: false },
      { chainSlug: "tottus", price: 7990, isOnSale: false },
      { chainSlug: "unimarc", price: 8290, isOnSale: false },
    ],
  },
  {
    id: "panales-babysec",
    name: "Pañales Babysec Premium Talla M (40 un)",
    brand: "Babysec",
    format: "40 un",
    category: "Bebés",
    emoji: "👶",
    prices: [
      { chainSlug: "jumbo", price: 12990, isOnSale: false },
      { chainSlug: "lider", price: 11990, isOnSale: true },
      { chainSlug: "santa-isabel", price: 12990, isOnSale: false },
      { chainSlug: "tottus", price: 12490, isOnSale: false },
      { chainSlug: "unimarc", price: 13290, isOnSale: false },
      { chainSlug: "cruz-verde", price: 13990, isOnSale: false },
      { chainSlug: "salcobrand", price: 13790, isOnSale: false },
      { chainSlug: "ahumada", price: 13890, isOnSale: false },
    ],
  },
  {
    id: "paracetamol-500",
    name: "Paracetamol 500mg (16 comprimidos)",
    brand: "Genérico",
    format: "16 comp.",
    category: "Medicamentos",
    emoji: "💊",
    prices: [
      { chainSlug: "cruz-verde", price: 1590, isOnSale: false },
      { chainSlug: "salcobrand", price: 1490, isOnSale: true },
      { chainSlug: "ahumada", price: 1690, isOnSale: false },
    ],
  },
  {
    id: "ibuprofeno-400",
    name: "Ibuprofeno 400mg (20 comprimidos)",
    brand: "Genérico",
    format: "20 comp.",
    category: "Medicamentos",
    emoji: "💊",
    prices: [
      { chainSlug: "cruz-verde", price: 2490, isOnSale: false },
      { chainSlug: "salcobrand", price: 2290, isOnSale: true },
      { chainSlug: "ahumada", price: 2590, isOnSale: false },
    ],
  },
  {
    id: "shampoo-sedal",
    name: "Shampoo Sedal Ceramidas 650ml",
    brand: "Sedal",
    format: "650 ml",
    category: "Cuidado personal",
    emoji: "🧴",
    prices: [
      { chainSlug: "jumbo", price: 4490, isOnSale: false },
      { chainSlug: "lider", price: 4290, isOnSale: false },
      { chainSlug: "santa-isabel", price: 4490, isOnSale: false },
      { chainSlug: "tottus", price: 4190, isOnSale: true },
      { chainSlug: "unimarc", price: 4590, isOnSale: false },
      { chainSlug: "cruz-verde", price: 4990, isOnSale: false },
      { chainSlug: "salcobrand", price: 4890, isOnSale: false },
      { chainSlug: "ahumada", price: 4990, isOnSale: false },
    ],
  },
];

export const COMUNAS = [
  "Santiago", "Providencia", "Las Condes", "Ñuñoa", "La Florida",
  "Maipú", "Puente Alto", "Vitacura", "Lo Barnechea", "San Miguel",
  "Viña del Mar", "Valparaíso", "Concepción", "Temuco", "Antofagasta",
  "La Serena", "Valdivia", "Puerto Montt", "Rancagua", "Talca",
];

export function getChain(slug: string): Chain | undefined {
  return CHAINS.find((c) => c.slug === slug);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q),
  );
}

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function formatCLP(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}
