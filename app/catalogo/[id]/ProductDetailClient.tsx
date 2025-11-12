// app/catalogo/[id]/ProductDetailClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { fetchProductById, formatPrice } from "@/lib/products";

/** Tipos locales */
type RelatedProduct = {
  id: string;
  name: string;
  image?: string | null;
  shortDescription?: string | null;
  price?: number | null | undefined;
};

type ProductLocal = {
  id: string;
  name: string;
  subtitle?: string | null;
  description?: string | null;
  images?: string[] | null;
  basePrice?: number | null | undefined;
  price?: number | null | undefined;
  sku?: string | null;
  tags?: string[] | null;
  featured?: boolean | null;
  relatedProducts?: RelatedProduct[] | null;
};

type Props = { itemId: string };

export default function ProductDetailClient({ itemId }: Props) {
  const id = itemId;

  const [product, setProduct] = useState<ProductLocal | null | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // opciones básicas
  const [quantity, setQuantity] = useState<number>(1);

  // leer más
  const [showMore, setShowMore] = useState<boolean>(false);
  const DESCRIPTION_SHORT_PX = 140;

  // Helper: normaliza number | null | undefined -> number
  const safeNumber = (v: number | null | undefined) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) {
        setProduct(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const p = (await fetchProductById(id)) as any;
        if (!cancelled) setProduct(p ? (p as ProductLocal) : null);
      } catch (err: any) {
        console.error("Error cargando producto:", err);
        if (!cancelled) {
          setError("No se pudo cargar el producto.");
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading || product === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-lg font-medium">Cargando producto…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <Link href="/catalogo" className="inline-block px-4 py-2 bg-purple-600 text-white rounded">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Producto no encontrado</h1>
          <Link href="/catalogo" className="inline-block px-4 py-2 bg-purple-600 text-white rounded">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const isLongDescription = !!product.description && product.description.length > 350;

  // totalPrice ya es number gracias a safeNumber
  const totalPrice = safeNumber(product.basePrice ?? product.price) * quantity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50 pb-12">
      <header className="border-b bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/catalogo" className="flex items-center gap-3 text-gray-700">
            <ArrowLeft className="w-5 h-5" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg">Eternal Love</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* IMAGEN */}
          <div className="space-y-6">
            <div className="rounded-lg overflow-hidden bg-white shadow">
              <img
                src={product.images?.[0] ?? "/placeholder.svg"}
                alt={product.name}
                className="w-full h-[500px] object-cover"
              />
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((im, i) => (
                  <div key={i} className="w-20 h-20 rounded overflow-hidden border">
                    <img src={im ?? "/placeholder.svg"} className="w-full h-full object-cover" alt={`${product.name} ${i}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DETALLES */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">{product.name}</h1>
              {product.subtitle && <p className="text-sm text-gray-500 mt-1">{product.subtitle}</p>}
            </div>

            {/* ----- CUADRO DE DESCRIPCION (card) ----- */}
            <div className="bg-white border border-pink-100 rounded-lg shadow-sm p-5">
              <h2 className="text-lg font-semibold text-purple-700 mb-2">Descripción</h2>

              <div
                className="text-sm text-gray-700 leading-relaxed transition-[max-height] duration-200"
                style={{
                  whiteSpace: "pre-wrap",
                  overflow: "hidden",
                  maxHeight: showMore ? "1000px" : `${DESCRIPTION_SHORT_PX}px`,
                }}
                aria-expanded={showMore}
              >
                {product.description ?? "No hay descripción disponible para este producto."}
              </div>

              <div className="mt-4 text-xs text-gray-500 flex gap-3 flex-wrap">
                {product.sku && <span>SKU: {product.sku}</span>}
                {product.tags && product.tags.length > 0 && (
                  <span>
                    Etiquetas:{" "}
                    {product.tags.slice(0, 5).map((t, i) => (
                      <span key={i} className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 rounded mr-1">
                        #{t}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>

            {/* ----- PRECIO Y ACCIONES ----- */}
            <div className="bg-white rounded-lg shadow p-5 border border-pink-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Precio</div>
                  <div className="text-2xl font-extrabold text-red-600">
                    {formatPrice(safeNumber(product.basePrice ?? product.price))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-lg font-semibold text-gray-800">{formatPrice(safeNumber(totalPrice))}</div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-2">Cantidad</label>
                <select
                  value={String(quantity)}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="1">1 unidad</option>
                  <option value="2">2 unidades</option>
                  <option value="3">3 unidades</option>
                  <option value="4">4 unidades</option>
                </select>
              </div>

              <div className="mt-4 grid gap-3">
                <Link
                  href={`/cotizacion?productId=${encodeURIComponent(product.id)}&qty=${quantity}`}
                  className="inline-block text-center py-3 rounded bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold"
                >
                  Solicitar Cotización - {formatPrice(safeNumber(totalPrice))}
                </Link>

                <Link
                  href={`/contacto?productId=${encodeURIComponent(product.id)}`}
                  className="inline-block text-center py-2 rounded border border-gray-200 text-sm text-gray-700 bg-white"
                >
                  Solicitar Cotización Personalizada
                </Link>
              </div>
            </div>

            {/* ----- Características ----- */}
            <div className="bg-white border border-pink-50 rounded-lg shadow-sm p-5">
              <h3 className="font-semibold mb-2 text-gray-800">Características del producto</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Impresión de alta calidad y duradera</li>
                <li>Materiales premium seleccionados</li>
                <li>Personalización 100% a tu gusto</li>
                <li>Entrega rápida y segura</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sección "Incluye" o productos relacionados (opcional) */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <section className="mt-12">
            <h3 className="text-xl font-semibold mb-4">Incluye</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {product.relatedProducts.map((rp: RelatedProduct) => (
                <div key={rp.id} className="flex items-start gap-4 bg-white p-4 rounded shadow-sm border">
                  <div className="w-16 h-16 rounded overflow-hidden bg-gray-50">
                    <img src={rp.image ?? "/placeholder.svg"} className="w-full h-full object-cover" alt={rp.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{rp.name}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate">{rp.shortDescription ?? ""}</div>
                  </div>
                  <div className="text-sm text-gray-700">{formatPrice(safeNumber(rp.price))}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
