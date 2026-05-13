import type { ChainKind } from "@prisma/client";

interface ChainSeed {
  slug: string;
  name: string;
  kind: ChainKind;
  websiteUrl: string;
  logoUrl: string | null;
}

export const CHAINS: ChainSeed[] = [
  // Supermercados
  { slug: "jumbo", name: "Jumbo", kind: "SUPERMARKET", websiteUrl: "https://www.jumbo.cl", logoUrl: null },
  { slug: "lider", name: "Líder", kind: "SUPERMARKET", websiteUrl: "https://www.lider.cl", logoUrl: null },
  { slug: "santa-isabel", name: "Santa Isabel", kind: "SUPERMARKET", websiteUrl: "https://www.santaisabel.cl", logoUrl: null },
  { slug: "tottus", name: "Tottus", kind: "SUPERMARKET", websiteUrl: "https://www.tottus.cl", logoUrl: null },
  { slug: "unimarc", name: "Unimarc", kind: "SUPERMARKET", websiteUrl: "https://www.unimarc.cl", logoUrl: null },
  // Farmacias
  { slug: "cruz-verde", name: "Cruz Verde", kind: "PHARMACY", websiteUrl: "https://www.cruzverde.cl", logoUrl: null },
  { slug: "salcobrand", name: "Salcobrand", kind: "PHARMACY", websiteUrl: "https://www.salcobrand.cl", logoUrl: null },
  { slug: "ahumada", name: "Ahumada", kind: "PHARMACY", websiteUrl: "https://www.farmaciasahumada.cl", logoUrl: null },
];
