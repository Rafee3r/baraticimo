export default function ProductoLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="skeleton h-5 w-16 rounded" />

      {/* Foto del producto */}
      <div className="skeleton mt-3 aspect-square w-full rounded-3xl" />

      {/* Info */}
      <div className="mt-4 space-y-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-6 w-4/5 rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
      </div>

      {/* Precio destacado (gradiente oscuro) */}
      <div className="mt-4 space-y-3 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-6">
        <div className="skeleton h-3 w-20 rounded bg-white/20" />
        <div className="skeleton h-10 w-2/3 rounded bg-white/20" />
        <div className="skeleton h-4 w-1/2 rounded bg-white/20" />
      </div>

      {/* Botón add to list */}
      <div className="skeleton mt-4 h-12 w-full rounded-2xl" />

      {/* Tabla comparativa */}
      <div className="mt-5 space-y-3">
        <div className="skeleton h-5 w-2/3 rounded" />
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 last:border-0">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-5 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
