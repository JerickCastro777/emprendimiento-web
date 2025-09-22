// app/catalogo/[id]/ProductDetailClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart } from "lucide-react";

import { fetchProductById, formatPrice } from "@/lib/products";
import type { Product } from "@/lib/products";

type Props = { itemId: string };

export default function ProductDetailClient({ itemId }: Props) {
  const id = itemId;

  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [customMessage, setCustomMessage] = useState("");

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
        const p = await fetchProductById(id);
        if (!cancelled) setProduct(p ?? null);
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
        <div className="text-center">
          <p className="text-lg font-medium">Cargando producto…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <Button asChild>
            <Link href="/catalogo">Volver al catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Producto no encontrado</h1>
          <Button asChild>
            <Link href="/catalogo">Volver al catálogo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalPrice = (product.basePrice ?? 0) * quantity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/catalogo" className="flex items-center space-x-2">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white fill-current" />
                </div>
                <span className="text-lg font-bold text-red-600">Eternal Love</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg bg-white shadow-sm">
              <img src={product.images?.[0] ?? "/placeholder.svg"} alt={product.name} className="w-full h-96 object-cover" />
              {product.featured && <Badge className="absolute top-4 left-4 bg-red-500">Destacado</Badge>}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
              {product.subtitle && <p className="text-sm text-gray-500 mt-1">{product.subtitle}</p>}
            </div>

            <div className="text-2xl font-extrabold text-red-600">{formatPrice(product.basePrice ?? product.price)}</div>

            <div className="p-4 border rounded-md bg-white">
              <h3 className="font-semibold mb-2">Opciones de Personalización</h3>
              <label className="block text-sm text-gray-600 mb-2">Cantidad</label>
              <select value={String(quantity)} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-2 w-full border rounded px-3 py-2">
                <option value="1">1 unidad</option>
                <option value="2">2 unidades</option>
                <option value="3">3 unidades</option>
              </select>
            </div>

            <div className="space-y-2">
              <Link
                href={`/cotizacion?productId=${encodeURIComponent(product.id)}`}
                className="inline-block w-full text-center py-3 rounded-md bg-pink-500 text-white font-semibold hover:bg-pink-600 transition"
              >
                Solicitar Cotización - {formatPrice(product.basePrice ?? product.price)}
              </Link>

              <Link
                href={`/contacto?productId=${encodeURIComponent(product.id)}`}
                className="inline-block w-full text-center py-2 rounded-md border border-gray-200 text-sm text-gray-700 bg-white hover:shadow-sm"
              >
                Solicitar Cotización Personalizada
              </Link>
            </div>

            <div className="p-4 bg-white border rounded-md">
              <h4 className="font-semibold mb-2">Características del producto:</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Impresión de alta calidad y duradera</li>
                <li>Materiales premium seleccionados</li>
                <li>Personalización 100% a tu gusto</li>
                <li>Entrega rápida y segura</li>
                <li>Garantía de satisfacción</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
