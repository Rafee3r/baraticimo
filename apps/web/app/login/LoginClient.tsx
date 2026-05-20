"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

type Mode = "login" | "signup";

export function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl });
    } catch (e) {
      setError("No pudimos iniciar con Google. Intenta de nuevo.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "No pudimos crear la cuenta");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError(
          mode === "login"
            ? "Email o contraseña incorrectos."
            : "Cuenta creada pero no pudimos iniciar sesión. Intenta de nuevo.",
        );
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError("Algo salió mal. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-4 py-8">
      <Link href="/" className="mb-6 inline-flex items-center text-sm text-neutral-500 hover:underline">
        ← Volver al inicio
      </Link>

      <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-neutral-200 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {mode === "login"
            ? "Entra para guardar tu lista y verla en cualquier dispositivo."
            : "Te ayudamos a ahorrar en cada compra."}
        </p>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 ring-1 ring-neutral-300 transition hover:bg-neutral-50 active:scale-[0.98] disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.61z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.81 5.96-2.19l-2.9-2.26c-.81.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.97v2.33A8.99 8.99 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.95 10.69A5.41 5.41 0 0 1 3.66 9c0-.59.1-1.16.28-1.69V4.96H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.99-2.35z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 .96 4.96l2.99 2.35c.71-2.13 2.7-3.73 5.05-3.73z"
            />
          </svg>
          Continuar con Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200" />
          o con tu email
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Tu nombre (opcional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-lime-500 focus:ring-1 focus:ring-lime-500"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-lime-500 focus:ring-1 focus:ring-lime-500"
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition focus:border-lime-500 focus:ring-1 focus:ring-lime-500"
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50"
          >
            {loading
              ? "Procesando..."
              : mode === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-neutral-500">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="font-semibold text-lime-600 hover:underline"
          >
            {mode === "login" ? "Crear una" : "Iniciar sesión"}
          </button>
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-400">
        Al continuar aceptas que guardemos tu email para tu cuenta.
        <br />
        Nunca te enviaremos spam.
      </p>
    </main>
  );
}
