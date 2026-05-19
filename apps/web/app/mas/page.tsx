import Link from "next/link";
import { getStats } from "../../lib/queries";

export const metadata = { title: "Más — Baratícimo" };
export const revalidate = 300;

export default async function MasPage() {
  const stats = await getStats();

  return (
    <main className="mx-auto max-w-2xl px-4 pt-4 sm:px-6 sm:pt-6">
      <h1 className="text-2xl font-bold">Más</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Opciones y ajustes de Baratícimo
      </p>

      {/* Stats en tiempo real */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-4 text-center ring-1 ring-neutral-200">
          <div className="text-2xl font-bold text-neutral-900">
            {stats.productCount.toLocaleString("es-CL")}
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">Productos</div>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center ring-1 ring-neutral-200">
          <div className="text-2xl font-bold text-emerald-600">
            {stats.saleCount.toLocaleString("es-CL")}
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">En oferta</div>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center ring-1 ring-neutral-200">
          <div className="text-2xl font-bold text-neutral-900">
            {stats.priceCount.toLocaleString("es-CL")}
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">Registros</div>
        </div>
      </div>

      <section className="mt-6 space-y-3">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
          <h2 className="text-base font-semibold">📱 Agrega Baratícimo a tu pantalla de inicio</h2>
          <p className="mt-1 text-sm text-neutral-600">
            En tu celular: abre el menú del navegador (Safari → Compartir, Chrome → ⋮)
            y elige <strong>"Agregar a inicio"</strong>. Vas a tener un ícono como
            si fuera una app, sin pasar por la App Store.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
          <h2 className="text-base font-semibold">🏪 Cadenas incluidas</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { name: "Jumbo", color: "#00873A", status: "live" as const },
              { name: "Santa Isabel", color: "#E60028", status: "live" as const },
              { name: "Tottus", color: "#FFB81C", status: "live" as const },
              { name: "Unimarc", color: "#003DA5", status: "live" as const },
              { name: "Cruz Verde", color: "#00A651", status: "live" as const },
              { name: "Salcobrand", color: "#005DAA", status: "live" as const },
              { name: "Ahumada", color: "#E4002B", status: "live" as const },
            ].map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-sm"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                <span className="font-medium">{c.name}</span>
                <span className="ml-auto text-[10px] font-bold text-emerald-600">
                  ACTIVO
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
          <h2 className="text-base font-semibold">ℹ️ Sobre los precios</h2>
          <ul className="mt-2 space-y-2 text-sm text-neutral-600">
            <li>• Los precios se actualizan cada noche a las 3 AM hora Chile.</li>
            <li>
              • Mostramos los <strong>precios del sitio web</strong> de cada cadena.
              El precio en tienda física puede diferir.
            </li>
            <li>
              • Los productos marcados{" "}
              <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-700">
                💻 online
              </span>{" "}
              no están disponibles en sucursal.
            </li>
          </ul>
        </div>

        <Link
          href="/favoritos"
          className="block rounded-2xl bg-white p-5 ring-1 ring-neutral-200"
        >
          <h2 className="text-base font-semibold">♥ Mis guardados</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Ver los productos que marcaste como favorito →
          </p>
        </Link>

        <Link
          href="https://github.com/Rafee3r/baraticimo"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl bg-white p-5 ring-1 ring-neutral-200"
        >
          <h2 className="text-base font-semibold">👨‍💻 Código abierto</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Baratícimo es open source en GitHub →
          </p>
        </Link>

        <p className="pt-4 text-center text-xs text-neutral-400">
          Hecho con ♥ en Chile
        </p>
      </section>
    </main>
  );
}
