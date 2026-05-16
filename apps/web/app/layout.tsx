import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { ListProvider } from "../components/ListContext";

export const metadata: Metadata = {
  title: {
    default: "Baratícimo — Compara precios",
    template: "%s — Baratícimo",
  },
  description:
    "Compara precios entre supermercados y farmacias en Chile. Arma tu lista y encuentra dónde comprar más barato.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Baratícimo",
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "Baratícimo",
    title: "Baratícimo — Compara precios en Chile",
    description: "Compara precios entre supermercados y farmacias. Arma tu lista y ahorra.",
  },
  twitter: {
    card: "summary",
    title: "Baratícimo — Compara precios en Chile",
    description: "Compara precios entre supermercados y farmacias. Arma tu lista y ahorra.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://baraticimo.cl",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ListProvider>
          <Header />
          <div className="pb-24 md:pb-0">
            {children}
          </div>
          <BottomNav />
        </ListProvider>
      </body>
    </html>
  );
}
