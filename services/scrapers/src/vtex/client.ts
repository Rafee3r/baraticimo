import pLimit from "p-limit";

const USER_AGENT = process.env.SCRAPER_USER_AGENT ?? "BaraticimoBot/0.1 (+contacto@example.cl)";
const RATE_LIMIT = Number(process.env.SCRAPER_RATE_LIMIT_PER_SEC ?? 3);

/**
 * Cliente para el catalogo publico VTEX. La mayoria de cadenas chilenas
 * (Jumbo, Lider, Santa Isabel, Tottus, Cruz Verde, Salcobrand, Ahumada)
 * exponen este endpoint sin autenticacion.
 *
 * Doc: https://developers.vtex.com/docs/api-reference/search-api
 */
export interface VtexProduct {
  productId: string;
  productName: string;
  brand: string | null;
  link: string; // path absoluto, hay que prefijar con el dominio
  items: VtexItem[];
}

interface VtexItem {
  itemId: string;
  name: string;
  measurementUnit?: string;
  unitMultiplier?: number;
  images: { imageUrl: string }[];
  sellers: VtexSeller[];
}

interface VtexSeller {
  sellerId: string;
  commertialOffer: {
    Price: number;
    ListPrice: number;
    IsAvailable: boolean;
  };
}

export class VtexClient {
  private limiter = pLimit(1);
  private lastRequestAt = 0;
  private minDelayMs = Math.ceil(1000 / RATE_LIMIT);

  constructor(private baseUrl: string) {}

  private async throttle() {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.minDelayMs) {
      await new Promise((r) => setTimeout(r, this.minDelayMs - elapsed));
    }
    this.lastRequestAt = Date.now();
  }

  async searchByCategory(categoryId: string, from = 0, to = 49): Promise<VtexProduct[]> {
    return this.limiter(async () => {
      await this.throttle();
      const url = `${this.baseUrl}/api/catalog_system/pub/products/search/?fq=C:${categoryId}&_from=${from}&_to=${to}`;
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) throw new Error(`VTEX ${res.status} en ${url}`);
      return (await res.json()) as VtexProduct[];
    });
  }

  async searchByQuery(query: string, from = 0, to = 49): Promise<VtexProduct[]> {
    return this.limiter(async () => {
      await this.throttle();
      const url = `${this.baseUrl}/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?_from=${from}&_to=${to}`;
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) throw new Error(`VTEX ${res.status} en ${url}`);
      return (await res.json()) as VtexProduct[];
    });
  }
}
