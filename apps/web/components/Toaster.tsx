"use client";
import { createContext, useCallback, useContext, useState } from "react";

interface Toast {
  id: number;
  message: string;
  kind?: "success" | "info" | "error";
}

interface ToastApi {
  toast: (message: string, kind?: Toast["kind"]) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: Toast["kind"] = "success") => {
    const id = nextId++;
    setToasts((cur) => [...cur, { id, message, kind }]);
    setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.id !== id));
    }, 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-enter pointer-events-auto rounded-full px-4 py-2.5 text-sm font-medium shadow-lg ring-1 ${
              t.kind === "success"
                ? "bg-emerald-600 text-white ring-emerald-700"
                : t.kind === "error"
                  ? "bg-red-600 text-white ring-red-700"
                  : "bg-neutral-900 text-white ring-neutral-800"
            }`}
          >
            {t.kind === "success" && "✓ "}
            {t.kind === "error" && "✗ "}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback no-op (si se usa antes de hidratar)
    return { toast: () => {} };
  }
  return ctx;
}
