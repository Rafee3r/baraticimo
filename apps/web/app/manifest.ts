import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Baratícimo",
    short_name: "Baratícimo",
    description:
      "Compara precios entre supermercados y farmacias en Chile. Arma tu lista y encuentra el más barato.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#10b981",
    orientation: "portrait",
    lang: "es-CL",
    categories: ["shopping", "lifestyle", "finance"],
    icons: [
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Buscar producto",
        short_name: "Buscar",
        url: "/buscar",
      },
      {
        name: "Mi lista",
        short_name: "Lista",
        url: "/lista",
      },
      {
        name: "Comparar",
        short_name: "Comparar",
        url: "/comparar",
      },
    ],
  };
}
