import type { MetadataRoute } from "next";
import { prisma } from "../lib/db";

export const revalidate = 3600; // regenerar cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://baraticimo.cl";

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${base}/buscar`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/comparar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/lista`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
  ];

  // Páginas de producto (hasta 5.000 — límite de sitemap es 50.000)
  const products = await prisma.chainProduct.findMany({
    select: { id: true, lastSeenAt: true },
    orderBy: { lastSeenAt: "desc" },
    take: 5000,
  });

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/producto/${p.id}`,
    lastModified: p.lastSeenAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages];
}
