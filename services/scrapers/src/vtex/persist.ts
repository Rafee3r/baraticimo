import { prisma } from "../db.js";
import type { VtexProduct } from "./client.js";

interface PersistInput {
  chainSlug: string;
  baseUrl: string;
  products: VtexProduct[];
}

/**
 * Persiste productos de una cadena VTEX en chain_products + prices.
 * No empareja al producto canonico — eso lo hace el matcher IA aparte.
 */
export async function persistVtexProducts({ chainSlug, baseUrl, products }: PersistInput) {
  const chain = await prisma.chain.findUnique({ where: { slug: chainSlug } });
  if (!chain) throw new Error(`Cadena no existe: ${chainSlug}`);

  let saved = 0;
  for (const p of products) {
    const item = p.items[0];
    if (!item) continue;
    const seller = item.sellers.find((s) => s.commertialOffer.IsAvailable);
    if (!seller) continue;

    const offer = seller.commertialOffer;
    const imageUrl = item.images[0]?.imageUrl ?? null;
    const productUrl = p.link.startsWith("http") ? p.link : `${baseUrl}${p.link}`;

    const cp = await prisma.chainProduct.upsert({
      where: { chainId_externalId: { chainId: chain.id, externalId: p.productId } },
      create: {
        chainId: chain.id,
        externalId: p.productId,
        name: p.productName,
        brand: p.brand,
        format: item.measurementUnit ?? null,
        imageUrl,
        url: productUrl,
      },
      update: {
        name: p.productName,
        brand: p.brand,
        format: item.measurementUnit ?? null,
        imageUrl,
        url: productUrl,
        lastSeenAt: new Date(),
      },
    });

    await prisma.price.create({
      data: {
        chainProductId: cp.id,
        storeId: null,
        price: offer.Price,
        listPrice: offer.ListPrice && offer.ListPrice !== offer.Price ? offer.ListPrice : null,
        isOnSale: offer.ListPrice > offer.Price,
        source: "VTEX_API",
      },
    });

    saved++;
  }

  return saved;
}
