import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { ListProvider } from "../components/ListContext";

export const metadata: Metadata = {
  title: "Baratícimo — Compara precios y arma tu lista",
  description:
    "App chilena de comparación de precios entre supermercados y farmacias. Arma tu lista y encuentra el más barato.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Baratícimo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#10b981",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ListProvider>
          <Header />
          {children}
          <BottomNav />
        </ListProvider>
      </body>
    </html>
  );
}
