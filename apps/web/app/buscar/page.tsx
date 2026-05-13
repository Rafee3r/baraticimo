import Link from "next/link";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← Volver
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Resultados para “{q}”</h1>

      <div className="mt-8 rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
        <p>Aún no hay resultados de búsqueda conectados a la API.</p>
        <p className="mt-2 text-sm">
          Próximo paso: integrar tRPC con <code className="rounded bg-neutral-100 px-1">products.search</code>.
        </p>
      </div>
    </main>
  );
}
