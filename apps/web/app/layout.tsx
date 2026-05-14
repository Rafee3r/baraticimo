import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";

export const metadata: Metadata = {
  title: "Baratícimo — Compara precios de supermercados y farmacias en Chile",
  description:
    "Encuentra el supermercado más barato. Comparamos precios entre Jumbo, Santa Isabel y más, actualizados cada día.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10b981",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
