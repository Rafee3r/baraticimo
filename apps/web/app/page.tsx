import Link from "next/link";

const CHAINS = [
  { slug: "jumbo", name: "Jumbo", kind: "Supermercado" },
  { slug: "lider", name: "Líder", kind: "Supermercado" },
  { slug: "santa-isabel", name: "Santa Isabel", kind: "Supermercado" },
  { slug: "tottus", name: "Tottus", kind: "Supermercado" },
  { slug: "unimarc", name: "Unimarc", kind: "Supermercado" },
  { slug: "cruz-verde", name: "Cruz Verde", kind: "Farmacia" },
  { slug: "salcobrand", name: "Salcobrand", kind: "Farmacia" },
  { slug: "ahumada", name: "Ahumada", kind: "Farmacia" },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tight">Precios Chile</h1>
      <p className="mt-3 text-lg text-neutral-600">
        Compara precios entre supermercados y farmacias de todo Chile, actualizados a diario.
      </p>

      <form action="/buscar" className="mt-8 flex gap-2">
        <input
          name="q"
          type="search"
          placeholder="Buscar producto, ej: coca cola 1.5L"
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base focus:border-neutral-900 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-5 py-3 font-medium text-white hover:bg-neutral-800"
        >
          Buscar
        </button>
      </form>

      <section className="mt-12">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Cadenas incluidas
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CHAINS.map((c) => (
            <li
              key={c.slug}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-3"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-neutral-500">{c.kind}</div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
        <Link href="/comuna" className="hover:underline">
          Cambiar comuna →
        </Link>
      </footer>
    </main>
  );
}
