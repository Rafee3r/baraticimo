import { z } from "zod";
import type { ParsedProduct } from "@baraticimo/types";

const ParsedProductSchema = z.object({
  name: z.string(),
  brand: z.string().nullable(),
  price: z.number(),
  listPrice: z.number().nullable(),
  format: z.string().nullable(),
  isOnSale: z.boolean(),
});

interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

function config(): DeepSeekConfig {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY no está configurado");
  return {
    apiKey,
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
  };
}

/**
 * Llama a DeepSeek con un prompt + HTML y exige respuesta JSON.
 * Usa response_format: json_object para forzar JSON valido.
 */
async function callDeepSeek(systemPrompt: string, userContent: string): Promise<string> {
  const cfg = config();
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });
  if (!res.ok) {
    throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]!.message.content;
}

/**
 * Parser fallback: dado el HTML de una pagina de producto, extrae
 * los campos estructurados. Se usa cuando el parser fijo falla.
 */
export async function parseProductHtml(html: string): Promise<ParsedProduct> {
  const truncated = html.length > 30_000 ? html.slice(0, 30_000) : html;
  const system = `Eres un parser de productos de supermercados/farmacias chilenas.
Extrae los datos del producto desde el HTML y responde SOLO con JSON valido con esta forma:
{
  "name": string,           // nombre completo del producto
  "brand": string | null,
  "price": number,          // precio actual en CLP (sin "$" ni puntos)
  "listPrice": number | null, // precio normal sin oferta, o null si no aplica
  "format": string | null,  // gramaje/volumen, ej "1.5L", "500g", "12 un"
  "isOnSale": boolean
}`;
  const raw = await callDeepSeek(system, truncated);
  return ParsedProductSchema.parse(JSON.parse(raw));
}

// ─── Batch matcher (usa el context window de 178k) ──────────────────────────

interface BatchPair {
  idx: number;
  a: { name: string; brand: string | null; format: string | null };
  candidates: { id: string; name: string; brand: string | null; format: string | null }[];
}

interface BatchResult {
  idx: number;
  matchId: string | null;
  confidence: number;
}

const BATCH_SYSTEM = `Eres un sistema de matching de productos de supermercado. Recibes una lista de pares (producto fuente + candidatos) y decides cuál candidato corresponde al mismo SKU real (misma marca, mismo formato, mismo tipo). Ignora diferencias ortográficas menores ("Coca-Cola" vs "Coca Cola", "1,5L" vs "1.5L"). Si ningún candidato coincide con confianza ≥0.82, usa null.

Responde SOLO con JSON válido:
{"matches":[{"idx":0,"matchId":"id_o_null","confidence":0.0},...]}`

/**
 * Matcher en batch: procesa hasta 150 pares en una sola llamada.
 * Mucho más eficiente que matchProduct() individual para runs nocturnos.
 */
export async function batchMatchProducts(
  pairs: BatchPair[],
): Promise<Map<number, { productId: string; confidence: number }>> {
  if (pairs.length === 0) return new Map();

  const raw = await callDeepSeek(BATCH_SYSTEM, JSON.stringify(pairs));
  const parsed = z
    .object({
      matches: z.array(
        z.object({
          idx: z.number(),
          matchId: z.string().nullable(),
          confidence: z.number().min(0).max(1),
        }),
      ),
    })
    .parse(JSON.parse(raw));

  const result = new Map<number, { productId: string; confidence: number }>();
  for (const m of parsed.matches) {
    if (m.matchId && m.confidence >= 0.82) {
      result.set(m.idx, { productId: m.matchId, confidence: m.confidence });
    }
  }
  return result;
}

// ─── Batch categorizer ──────────────────────────────────────────────────────

export const CATEGORIES_LIST = [
  "despensa",
  "lacteos",
  "carnes",
  "frutas-verduras",
  "bebidas",
  "snacks",
  "congelados",
  "limpieza",
  "belleza",
  "bebes",
  "mascotas",
  "farmacia",
  "panaderia",
  "desayuno",
  "otros",
] as const;

export type ProductCategory = (typeof CATEGORIES_LIST)[number];

const CATEGORIZE_SYSTEM = `Eres un clasificador de productos de supermercado y farmacia en Chile.

Para cada producto te llega su nombre. Asígnale UNA categoría de esta lista exacta:

- despensa: arroz, fideos, aceites, salsas, conservas (atún), harina, azúcar, sal, vinagre
- lacteos: leche, yogurt, queso, mantequilla, crema, manjar, quesillo
- carnes: carne vacuna, pollo, cerdo, pavo, pescado, mariscos, embutidos, longanizas, jamón
- frutas-verduras: frutas y verduras frescas (no congeladas, no en conserva)
- bebidas: jugo, bebida, agua, energéticas, cerveza, vino, licor
- snacks: galletas, chocolate, dulces, papas fritas, ramitas, frutos secos, alfajores
- congelados: helados, papas fritas congeladas, nuggets, pre-cocidos, pizzas congeladas
- limpieza: detergentes, jabones, cloro, lavaloza, papel higiénico, toallitas, suavizantes
- belleza: shampoo, acondicionador, cremas faciales/corporales, maquillaje, desodorantes, perfumes
- bebes: pañales, papillas, colados, leche infantil, biberones, toallitas húmedas
- mascotas: alimento para perros/gatos, snacks de mascotas, accesorios pet
- farmacia: vitaminas, suplementos, medicamentos, dermocosmética farmacéutica, protector solar farmacia
- panaderia: pan, masas, repostería, queques, tortas
- desayuno: cereales, café, té, mermeladas, mieles, granolas
- otros: cualquier producto que no calce claramente en las anteriores

Responde SOLO con JSON válido: {"items":[{"idx":0,"category":"lacteos"},...]}`;

interface CategorizeInput {
  idx: number;
  name: string;
  brand?: string | null;
}

/**
 * Clasifica un batch de productos en categorías. Procesa ~80 productos por llamada.
 * Usa el context window grande de DeepSeek v4 para eficiencia.
 */
export async function batchCategorize(
  products: CategorizeInput[],
): Promise<Map<number, ProductCategory>> {
  if (products.length === 0) return new Map();

  const userContent = JSON.stringify(
    products.map((p) => ({ idx: p.idx, name: p.name, brand: p.brand ?? null })),
  );

  const raw = await callDeepSeek(CATEGORIZE_SYSTEM, userContent);
  const parsed = z
    .object({
      items: z.array(
        z.object({
          idx: z.number(),
          category: z.enum(CATEGORIES_LIST),
        }),
      ),
    })
    .parse(JSON.parse(raw));

  const result = new Map<number, ProductCategory>();
  for (const item of parsed.items) result.set(item.idx, item.category);
  return result;
}

/**
 * Matcher: dados un chain_product (nombre/marca/formato) y un set de
 * productos canonicos candidatos, decide cual hace match.
 * Devuelve null si la confianza es baja.
 */
export async function matchProduct(input: {
  chainProduct: { name: string; brand: string | null; format: string | null };
  candidates: { id: string; name: string; brand: string | null; format: string | null }[];
}): Promise<{ productId: string; confidence: number } | null> {
  if (input.candidates.length === 0) return null;
  const system = `Eres un sistema de matching de productos. Recibes un producto de una cadena especifica y una lista de productos canonicos candidatos. Determina cual candidato corresponde al mismo SKU real (misma marca, mismo formato, mismo tipo de producto). Si ninguno corresponde con confianza alta, devuelve null.

Responde SOLO con JSON:
{
  "productId": string | null,
  "confidence": number   // 0 a 1
}`;
  const user = JSON.stringify(input);
  const raw = await callDeepSeek(system, user);
  const parsed = z
    .object({ productId: z.string().nullable(), confidence: z.number().min(0).max(1) })
    .parse(JSON.parse(raw));
  if (!parsed.productId || parsed.confidence < 0.7) return null;
  return { productId: parsed.productId, confidence: parsed.confidence };
}
