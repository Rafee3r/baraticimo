export type ChainKind = "SUPERMARKET" | "PHARMACY";

export type PriceSource =
  | "VTEX_API"
  | "PLAYWRIGHT"
  | "AI_PARSER"
  | "CROWDSOURCE";

export interface Chain {
  id: string;
  slug: string;
  name: string;
  kind: ChainKind;
  logoUrl: string | null;
}

export interface Comuna {
  id: string;
  name: string;
  region: string;
  code: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  brand: string | null;
  format: string | null;
  category: string | null;
  imageUrl: string | null;
}

export interface PriceQuote {
  chain: Chain;
  chainProductId: string;
  productUrl: string;
  price: number;
  listPrice: number | null;
  currency: "CLP";
  isOnSale: boolean;
  scrapedAt: string; // ISO
  storeId: string | null;
  storeName: string | null;
  distanceKm: number | null;
}

export interface ProductWithQuotes {
  product: ProductSummary;
  quotes: PriceQuote[];
  cheapest: PriceQuote | null;
}

/**
 * Resultado del parser IA al extraer un producto desde HTML.
 */
export interface ParsedProduct {
  name: string;
  brand: string | null;
  price: number;
  listPrice: number | null;
  format: string | null;
  isOnSale: boolean;
}
