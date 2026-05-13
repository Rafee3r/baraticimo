import { z } from "zod";
import type { ParsedProduct } from "@precios/types";

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
