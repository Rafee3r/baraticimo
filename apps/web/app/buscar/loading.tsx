/**
 * Loading state para /buscar — skeleton de la grilla de resultados.
 * Next.js lo muestra automáticamente mientras la búsqueda corre en el server.
 */
export default function BuscarLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6">
      {/* Search bar skeleton */}
      <div className="skeleton h-12 rounded-2xl" />

      {/* Filter chips skeleton */}
      <div className="mt-3 flex gap-2">
        {[60, 90, 80, 70].map((w, i) => (
          <div key={i} className="skeleton h-7 rounded-full" style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* "Buscando…" indicator */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500">
        <SpinnerIcon />
        <span className="soft-pulse">Buscando productos…</span>
      </div>

      {/* Product grid skeleton */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
            <div className="skeleton aspect-square w-full" />
            <div className="space-y-2 p-3">
              <div className="skeleton h-3 w-1/3 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
              <div className="skeleton h-5 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin"
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
