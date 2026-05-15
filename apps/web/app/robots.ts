import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/lista", "/favoritos"],
      },
    ],
    sitemap: "https://baraticimo.cl/sitemap.xml",
  };
}
