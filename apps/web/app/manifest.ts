import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Baratícimo — Compara precios",
    short_name: "Baratícimo",
    description:
      "Compara precios entre supermercados y farmacias en Chile. Arma tu lista y encuentra el más barato.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#10b981",
    orientation: "portrait",
    lang: "es-CL",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    categories: ["shopping", "lifestyle", "finance"],
  };
}
