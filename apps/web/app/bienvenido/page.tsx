import Link from "next/link";
import type { Metadata } from "next";
import { getStats } from "../../lib/queries";

export const metadata: Metadata = {
  title: "Ahorra en tu compra del mes",
  description:
    "Compara los precios de Jumbo, Líder, Santa Isabel, Tottus, Unimarc, Cruz Verde, Salcobrand y Ahumada en un solo lugar. Arma tu lista y descubre dónde te sale más barata.",
};

export const revalidate = 600;

export default async function BienvenidoPage() {
  const stats = await getStats().catch(() => ({
    productCount: 25000,
    saleCount: 4000,
    priceCount: 100000,
  }));

  const productCount = stats.productCount.toLocaleString("es-CL");
  const saleCount = stats.saleCount.toLocaleString("es-CL");

  return (
    <main className="-mx-4 -mt-1 md:-mx-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-neutral-900 px-6 pb-14 pt-12 text-white sm:px-10 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-white/20 backdrop-blur">
            🇨🇱 La forma más fácil de ahorrar en Chile
          </span>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Ahorra hasta un{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-emerald-300 bg-clip-text text-transparent">
              30% en tu compra
            </span>{" "}
            del mes
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-emerald-100 sm:text-lg">
            Compara precios entre Jumbo, Líder, Santa Isabel, Tottus, Unimarc y
            las farmacias más grandes. Arma tu lista y la app te dice dónde te
            sale más barata.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="w-full rounded-2xl bg-white px-6 py-4 text-base font-bold text-emerald-800 shadow-lg transition active:scale-95 hover:bg-emerald-50 sm:w-auto sm:px-8"
            >
              Empezar gratis →
            </Link>
            <Link
              href="/"
              className="w-full rounded-2xl bg-white/10 px-6 py-4 text-base font-semibold text-white ring-1 ring-white/30 backdrop-blur transition active:scale-95 hover:bg-white/20 sm:w-auto sm:px-8"
            >
              Ver la app
            </Link>
          </div>
          <p className="mt-3 text-xs text-emerald-200">
            Gratis · Sin tarjeta · 0 spam
          </p>
        </div>

        {/* Stats inferiores */}
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-3 sm:gap-6">
          <Stat label="Productos" value={productCount} />
          <Stat label="En oferta hoy" value={saleCount} accent />
          <Stat label="Cadenas" value="7" />
        </div>
      </section>

      {/* Problema → Solución */}
      <section className="bg-white px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-emerald-600">
            ¿Te suena?
          </p>
          <h2 className="mt-2 text-center text-2xl font-bold sm:text-3xl">
            Estás pagando de más sin saberlo
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-neutral-600">
            El mismo paquete de pañales cuesta <strong>$3.000 más</strong> en una
            cadena que en otra. El detergente, los lácteos, el papel higiénico:
            todo varía. Pero salir a comparar precios uno por uno es perder
            tiempo. Por eso existe Baratícimo.
          </p>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-neutral-50 px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Así funciona, en 3 pasos
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <Step
              num="1"
              emoji="🔍"
              title="Busca o agrega productos"
              text="Encuentra lo que sueles comprar. Tenemos miles de productos de las 8 cadenas más grandes de Chile."
            />
            <Step
              num="2"
              emoji="🛒"
              title="Arma tu lista"
              text="Agrega los productos como si fuera tu carrito. La app calcula el total en cada cadena al instante."
            />
            <Step
              num="3"
              emoji="💰"
              title="Compra donde sale más barato"
              text="Te decimos exactamente cuánto te ahorras comprando en Jumbo vs Líder vs Unimarc, etc."
            />
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="bg-white px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Lo que vas a tener
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Benefit
              emoji="🏪"
              title="8 cadenas en un solo lugar"
              text="Jumbo, Santa Isabel, Tottus, Unimarc, Cruz Verde, Salcobrand y Ahumada."
            />
            <Benefit
              emoji="📈"
              title="Historial de precios"
              text="¿La oferta de hoy es realmente una oferta? Te mostramos si el precio está en su mínimo o máximo histórico."
            />
            <Benefit
              emoji="✨"
              title="Búsqueda con IA"
              text="Buscas 'algo para lavar la ropa' y entendemos que es detergente. Tolera typos y términos vagos."
            />
            <Benefit
              emoji="🏆"
              title="Comparativa de lista completa"
              text="Tu lista entera, comparada cadena por cadena. Sin sumar a mano."
            />
            <Benefit
              emoji="🔄"
              title="Actualizado a diario"
              text="Los precios se refrescan cada noche. Lo que ves hoy, lo paga hoy."
            />
            <Benefit
              emoji="📱"
              title="Funciona en tu teléfono"
              text="Agrégala a tu pantalla de inicio y úsala como app. Sin descargas, sin App Store."
            />
          </div>
        </div>
      </section>

      {/* Social proof / FAQ corta */}
      <section className="bg-neutral-50 px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Preguntas frecuentes
          </h2>
          <div className="mt-8 space-y-4">
            <Faq
              q="¿Es realmente gratis?"
              a="Sí. Baratícimo es 100% gratis y open source. No vendemos tus datos."
            />
            <Faq
              q="¿De dónde sacan los precios?"
              a="Directamente de los sitios web oficiales de cada cadena. Se actualizan cada noche."
            />
            <Faq
              q="¿Necesito instalar algo?"
              a="No. Es una web app. Si quieres ícono en tu celular, puedes 'Agregar a pantalla de inicio' desde tu navegador."
            />
            <Faq
              q="¿Mi cuenta para qué sirve?"
              a="Para guardar tu lista de compras y verla en cualquier dispositivo. Sin cuenta también puedes usar la app, pero la lista solo queda en ese celular."
            />
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-16 text-center text-white sm:px-10">
        <h2 className="text-2xl font-extrabold sm:text-3xl">
          Empieza a ahorrar hoy
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base text-emerald-100">
          Crea tu cuenta en 30 segundos y arma tu primera lista.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-block rounded-2xl bg-white px-8 py-4 text-base font-bold text-emerald-800 shadow-lg transition active:scale-95 hover:bg-emerald-50"
        >
          Crear mi cuenta gratis →
        </Link>
        <p className="mt-4 text-xs text-emerald-200">
          Hecho con ♥ en Chile
        </p>
      </section>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-3 text-center ring-1 ring-white/20 backdrop-blur">
      <div className={`text-xl font-extrabold sm:text-2xl ${accent ? "text-yellow-300" : "text-white"}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-emerald-200 sm:text-xs">
        {label}
      </div>
    </div>
  );
}

function Step({ num, emoji, title, text }: { num: string; emoji: string; title: string; text: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-neutral-200">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
          {num}
        </span>
        <span className="text-2xl">{emoji}</span>
      </div>
      <h3 className="mt-3 text-base font-bold">{title}</h3>
      <p className="mt-1.5 text-sm text-neutral-600">{text}</p>
    </div>
  );
}

function Benefit({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
      <span className="text-2xl">{emoji}</span>
      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        <p className="mt-0.5 text-sm text-neutral-600">{text}</p>
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl bg-white px-5 py-4 ring-1 ring-neutral-200 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">
        {q}
        <span className="text-neutral-400 transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-2 text-sm text-neutral-600">{a}</p>
    </details>
  );
}
