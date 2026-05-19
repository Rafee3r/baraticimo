export default function CompararLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="skeleton h-6 w-40 rounded" />
      <div className="skeleton mt-2 h-4 w-2/3 rounded" />

      {/* Search bar */}
      <div className="skeleton mt-4 h-12 rounded-2xl" />

      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500">
        <Spinner />
        <span className="soft-pulse">Comparando entre cadenas…</span>
      </div>

      {/* Comparison cards */}
      <div className="mt-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
            <div className="flex items-center gap-3 p-4">
              <div className="skeleton h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-5 w-32 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-neutral-100">
              <div className="space-y-2 bg-neutral-50 p-3">
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton h-6 w-20 rounded" />
              </div>
              <div className="space-y-2 bg-neutral-50 p-3">
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton h-6 w-20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
