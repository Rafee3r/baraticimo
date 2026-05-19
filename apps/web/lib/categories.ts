// Categorías visibles en el home. Cada una tiene una lista de keywords:
// son los términos que se buscan con OR para llenar la categoría.
// Ej: "Frutas y verduras" busca tomate, papa, lechuga, ... (no solo tomate).

export interface Category {
  slug: string;
  name: string;
  emoji: string;
  keyword: string; // primer keyword (compat con código existente)
  keywords: string[]; // lista completa para búsqueda OR por categoría
}

export const CATEGORIES: Category[] = [
  {
    slug: "despensa", name: "Despensa", emoji: "🛒", keyword: "arroz",
    keywords: ["arroz", "fideos", "aceite", "azúcar", "harina", "sal", "salsa", "tuco", "lentejas", "porotos", "garbanzos", "atún", "conserva"],
  },
  {
    slug: "lacteos", name: "Lácteos", emoji: "🥛", keyword: "leche",
    keywords: ["leche", "yogurt", "yoghurt", "queso", "mantequilla", "crema", "manjar", "kéfir", "quesillo", "ricotta"],
  },
  {
    slug: "carnes", name: "Carnes", emoji: "🥩", keyword: "carne",
    keywords: ["carne", "pollo", "vacuno", "cerdo", "pavo", "lomo", "filete", "asado", "molida", "chuleta", "longaniza", "pescado", "salmón", "merluza"],
  },
  {
    slug: "frutas-verduras", name: "Frutas y verduras", emoji: "🥬", keyword: "tomate",
    keywords: ["tomate", "papa", "lechuga", "cebolla", "zanahoria", "manzana", "plátano", "palta", "limón", "naranja", "pera", "uva", "espinaca", "brócoli", "pimentón", "pepino"],
  },
  {
    slug: "bebidas", name: "Bebidas", emoji: "🥤", keyword: "bebida",
    keywords: ["bebida", "jugo", "agua", "coca cola", "fanta", "sprite", "pepsi", "energética", "cerveza", "vino"],
  },
  {
    slug: "snacks", name: "Snacks", emoji: "🍪", keyword: "galleta",
    keywords: ["galleta", "chocolate", "papas fritas", "ramita", "frutos secos", "chicle", "caramelo", "barra", "snack", "alfajor", "cabritas"],
  },
  {
    slug: "limpieza", name: "Limpieza", emoji: "🧴", keyword: "detergente",
    keywords: ["detergente", "cloro", "lavaloza", "desinfectante", "jabón", "limpiador", "esponja", "papel higiénico", "toalla nova", "lavavajilla", "suavizante"],
  },
  {
    slug: "belleza", name: "Belleza", emoji: "💄", keyword: "shampoo",
    keywords: ["shampoo", "acondicionador", "crema", "perfume", "desodorante", "labial", "rímel", "máscara", "tratamiento", "cepillo", "pasta dental"],
  },
  {
    slug: "bebes", name: "Bebés", emoji: "👶", keyword: "pañal",
    keywords: ["pañal", "pañales", "toallitas húmedas", "leche bebé", "papilla", "colado", "naturnes", "biberón", "mamadera", "shampoo bebé", "babysec", "huggies", "pampers"],
  },
  {
    slug: "mascotas", name: "Mascotas", emoji: "🐾", keyword: "perro",
    keywords: ["perro", "gato", "gatito", "alimento perro", "alimento gato", "whiskas", "pedigree", "cat chow", "master cat", "champion dog", "felix", "purina", "mascota"],
  },
];
