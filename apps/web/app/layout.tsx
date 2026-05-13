import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Baratícimo — Compara precios de supermercados y farmacias",
  description: "Encuentra el supermercado o farmacia más barato cerca tuyo en Chile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
