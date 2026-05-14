/**
 * Cliente DeepSeek para el web app.
 * Toda llamada a la IA ocurre server-side (Server Components o API routes).
 * La API key nunca llega al cliente.
 */

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEEPSEEK_MODEL = "deepseek-v4-flash";

async function callRaw(
  system: string,
  user: string,
  jsonMode: boolean,
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY no configurado");

  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      temperature: jsonMode ? 0 : 0.3,
      max_tokens: jsonMode ? 512 : 120,
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

/** Llama a DeepSeek y parsea la respuesta como JSON. Lanza si falla. */
export async function callDeepSeekJSON<T>(
  system: string,
  user: string,
): Promise<T> {
  const raw = await callRaw(system, user, true);
  return JSON.parse(raw) as T;
}

/** Llama a DeepSeek y retorna texto plano (para tips, descripciones, etc.). */
export async function callDeepSeekText(
  system: string,
  user: string,
): Promise<string> {
  return callRaw(system, user, false);
}
