export default function HomeLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-3 sm:px-6 sm:pt-5">
      {/* Hero */}
      <div className="skeleton h-44 rounded-2xl" />

      {/* Categorías pills */}
      <div className="mt-4 flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-9 w-28 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Comparativa */}
      <div className="mt-6 space-y-3">
        <div className="skeleton h-6 w-2/3 rounded" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Secciones */}
      {Array.from({ length: 3 }).map((_, s) => (
        <div key={s} className="mt-6">
          <div className="skeleton mb-3 h-5 w-40 rounded" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-32 shrink-0 sm:w-40">
                <div className="skeleton aspect-square w-full rounded-2xl" />
                <div className="skeleton mt-2 h-3 w-full rounded" />
                <div className="skeleton mt-1 h-3 w-2/3 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
