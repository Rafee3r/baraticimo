import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginClient } from "./LoginClient";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Inicia sesión o crea tu cuenta en Baratícimo.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
