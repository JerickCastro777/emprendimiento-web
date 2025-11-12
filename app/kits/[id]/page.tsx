// app/kits/[id]/page.tsx
import Link from "next/link";
import { getKitById, formatPrice } from "@/lib/products";

type Props = { params: { id: string } | Promise<{ id: string }> };

export default async function KitDetail({ params }: Props) {
  // params puede venir como Promise en algunos entornos Next
  const { id } = (await params) as { id: string };

  const kit = await getKitById(id);

  if (!kit) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-semibold mb-4">Kit no encontrado</h1>
        <p className="text-gray-600 mb-6">El kit solicitado no existe o fue eliminado.</p>
        <Link href="/kits" className="px-4 py-2 bg-purple-600 text-white rounded">Volver a Kits</Link>
      </div>
    );
  }

  const original =
    kit.originalPrice ??
    (kit.products ? kit.products.reduce((s, p) => s + (p.basePrice ?? 0), 0) : 0);
  const kitPrice = kit.kitPrice ?? original;
  const savings = Math.max(0, original - kitPrice);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50">
      <div className="container mx-auto px-4 py-10">
        {/* --- Top: logo + volver a kits (flecha) --- */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/kits"
              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 rounded px-2 py-1"
            >
              {/* Flecha simple */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="stroke-current">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-medium">Volver a Kits</span>
            </Link>

            {/* Logo (sin el círculo) */}
            <div className="w-28">
              <img
                src="/logo.png"
                alt="Eternal Love"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* espacio de equilibrio */}
          <div className="hidden md:block w-24" />
        </div>

        {/* --- Título centrado y descripción --- */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-3 tracking-tight">
            {kit.name}
          </h1>

          {kit.description ? (
            <p className="max-w-3xl mx-auto text-gray-600 text-lg">
              {kit.description}
            </p>
          ) : (
            <p className="max-w-3xl mx-auto text-gray-400">Sin descripción disponible.</p>
          )}
        </header>

        {/* --- Contenido: banda lateral de color + grid principal --- */}
        <div className="flex gap-8">
          {/* Banda de acento a la izquierda (color) */}
          <div className="hidden lg:block w-2 rounded-full bg-gradient-to-b from-amber-300 to-pink-300" />

          {/* Principal */}
          <div className="flex-1">
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              {/* Imagen + productos (col-span 2) */}
              <div className="lg:col-span-2">
                <div className="rounded-lg overflow-hidden shadow-lg bg-white ring-1 ring-amber-50">
                  {kit.image ? (
                    <img
                      src={kit.image}
                      alt={kit.name}
                      className="w-full h-[420px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-[420px] bg-gray-100 flex items-center justify-center text-gray-400">
                      Sin imagen del kit
                    </div>
                  )}
                </div>

                {/* Productos incluidos */}
                <section className="mt-6 bg-white rounded-lg p-6 shadow-sm ring-1 ring-amber-50">
                  <h2 className="text-xl font-semibold mb-4">Incluye</h2>

                  {kit.products && kit.products.length ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {kit.products.map((p) => (
<li
  key={p.id}
  className="flex items-center gap-4 p-3 border rounded hover:shadow-sm transition"
>
  <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
    <img
      src={(p.images && p.images[0]) || "/placeholder.svg"}
      alt={p.name}
      className="w-full h-full object-cover"
    />
  </div>

  {/* important: min-w-0 permite que el flex-1 en espacios reducidos se encoja correctamente */}
  <div className="flex-1 min-w-0">
    <div className="font-medium text-gray-800">{p.name}</div>

    {/* 
      Preferible: line-clamp-2 (2 líneas). Si no tienes el plugin, al menos conservar truncate + min-w-0.
      Uso break-words + overflow-hidden para evitar desbordes con cadenas largas sin espacios.
    */}
    <div className="text-xs text-gray-500 mt-1 overflow-hidden break-words">
      {/* Si tienes plugin line-clamp: usa "line-clamp-2" además */}
      <div className="line-clamp-2">
        {p.description ?? ""}
      </div>
    </div>
  </div>

  <div className="text-right w-28 flex-shrink-0">
    <div className="text-sm text-gray-700">{formatPrice(p.basePrice)}</div>
    {typeof p.stock !== "undefined" && (
      <div className="text-xs text-gray-400 mt-1">Stock: {p.stock}</div>
    )}
  </div>
</li>

                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500">No hay productos en este kit.</div>
                  )}
                </section>
              </div>

              {/* Panel de precios / CTA */}
              <aside className="bg-white rounded-xl p-6 shadow-xl h-fit ring-1 ring-purple-50">
                <div className="mb-4">
                  <div className="text-xs text-gray-500">Precio individual</div>
                  <div className="text-sm line-through text-gray-400">{original ? formatPrice(original) : "-"}</div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500">Precio del kit</div>
                  <div className="text-3xl font-bold text-purple-600">{formatPrice(kitPrice)}</div>
                </div>

                <div className="mb-6 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded flex items-center justify-between">
                  <div className="text-sm text-gray-600">Ahorra</div>
                  <div className="text-lg font-semibold text-green-600">{formatPrice(savings)}</div>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/catalogo"
                    className="block text-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg shadow"
                  >
                    Ver catálogo relacionado
                  </Link>

                  <Link
                    href="/contacto"
                    className="block text-center px-4 py-2 border rounded-lg text-purple-600 hover:bg-purple-50"
                  >
                    Consultar sobre este kit
                  </Link>
                </div>

                <div className="mt-6 text-sm text-gray-500">
                  <div className="mb-2">Etiquetas:</div>
                  <div className="flex flex-wrap gap-2">
                    {(kit.tags ?? []).length > 0
                      ? kit.tags.map((t: string, i: number) => (
                          <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700">{t}</span>
                        ))
                      : <span className="text-xs text-gray-400">No hay etiquetas</span>}
                  </div>
                </div>
              </aside>
            </div>

            {/* Footer / volver */}
            <div className="mt-8 text-sm text-gray-600 text-center">
              <Link href="/kits" className="underline">← Volver a Kits</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
