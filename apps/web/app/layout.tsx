import "./globals.css";
import type { Metadata } from "next";
import { Header } from "../components/Header";

export const metadata: Metadata = {
  title: "Baratícimo — Compara precios de supermercados y farmacias en Chile",
  description:
    "Encuentra el supermercado o farmacia más barato cerca tuyo. Comparamos precios entre Jumbo, Líder, Santa Isabel, Tottus, Unimarc, Cruz Verde, Salcobrand y Ahumada.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
