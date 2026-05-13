import { z } from "zod";
import { publicProcedure, router } from "../trpc.js";
import type { PriceQuote, ProductWithQuotes } from "@baraticimo/types";

export const productsRouter = router({
  search: publicProcedure
    .input(z.object({ q: z.string().min(1).max(100), limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      // Para el MVP usamos LIKE en Postgres; cuando integremos Meilisearch lo cambiamos
      const products = await ctx.prisma.product.findMany({
        where: { name: { contains: input.q, mode: "insensitive" } },
        take: input.limit,
        orderBy: { name: "asc" },
      });
      return products;
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<ProductWithQuotes | null> => {
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.id },
        include: {
          chainProducts: {
            include: {
              chain: true,
              prices: {
                orderBy: { scrapedAt: "desc" },
                take: 1,
              },
            },
          },
        },
      });
      if (!product) return null;

      const quotes: PriceQuote[] = product.chainProducts
        .filter((cp) => cp.prices.length > 0)
        .map((cp) => {
          const latest = cp.prices[0]!;
          return {
            chain: {
              id: cp.chain.id,
              slug: cp.chain.slug,
              name: cp.chain.name,
              kind: cp.chain.kind,
              logoUrl: cp.chain.logoUrl,
            },
            chainProductId: cp.id,
            productUrl: cp.url,
            price: Number(latest.price),
            listPrice: latest.listPrice ? Number(latest.listPrice) : null,
            currency: "CLP",
            isOnSale: latest.isOnSale,
            scrapedAt: latest.scrapedAt.toISOString(),
            storeId: latest.storeId,
            storeName: null,
            distanceKm: null,
          };
        })
        .sort((a, b) => a.price - b.price);

      return {
        product: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          format: product.format,
          category: product.category,
          imageUrl: product.imageUrl,
        },
        quotes,
        cheapest: quotes[0] ?? null,
      };
    }),
});
