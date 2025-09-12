// app/catalogo/page.tsx  (versión modificada)
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchAllProducts, searchProducts, formatPrice } from "@/lib/products";
import { Header } from "@/components/header";

type PriceRange = { min?: number; max?: number };

/** Normaliza el parámetro "holiday" que pueda venir en la URL. Acepta "halloween" o "#halloween" y devuelve "#halloween" (o undefined si no válido). */
function normalizeHolidayParam(h?: string | null): string | undefined {
  if (!h) return undefined;
  const q = String(h).trim().toLowerCase();
  if (!q) return undefined;
  return q.startsWith("#") ? q : `#${q}`;
}

export default function CatalogoPage() {
  const searchParams = useSearchParams();
  const holidayParam = searchParams?.get("holiday") ?? null;

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  // Eliminamos selectedCategory (ya no lo usamos)
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null);
  const [priceMax, setPriceMax] = useState<number>(0); // 0 = sin filtro
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar todos los productos al montar (para mostrar catálogo)
  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      setLoading(true);
      try {
        const products = await fetchAllProducts();
        if (!mounted) return;
        setAllProducts(products);
        setFilteredProducts(products);
      } catch (e: any) {
        console.error("Error cargando productos:", e);
        setError("No se pudieron cargar los productos. Intenta recargar.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  // Cuando cambian searchTerm / filtros / holiday hacemos la búsqueda (async)
  useEffect(() => {
    let mounted = true;
    async function runSearch() {
      setSearching(true);
      try {
        const holidayNormalized = normalizeHolidayParam(holidayParam);

        // Construimos priceRange según priceMax
        const pr = priceMax && priceMax > 0 ? { min: 0, max: priceMax } : undefined;

        const results = await searchProducts(
          searchTerm && searchTerm.length > 0 ? searchTerm : undefined,
          undefined, // category removed by user request
          pr ?? undefined,
          holidayNormalized
        );

        if (!mounted) return;
        if (Array.isArray(results)) {
          setFilteredProducts(results);
        } else {
          setFilteredProducts([]);
        }
      } catch (e) {
        console.error("Error en searchProducts:", e);
        setFilteredProducts([]);
      } finally {
        if (mounted) setSearching(false);
      }
    }

    const hasFilters = (priceMax && priceMax > 0) || Boolean(holidayParam);
    if (!searchTerm && !hasFilters) {
      setFilteredProducts(allProducts);
      setSearching(false);
      return;
    }

    runSearch();
    return () => {
      mounted = false;
    };
  }, [searchTerm, priceMax, allProducts, holidayParam]);

  // Handler del slider de precios (max)
  function onPriceSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value || 0);
    setPriceMax(v);
    // store priceRange indirectly (el effect leerá priceMax)
    setPriceRange(v > 0 ? { min: 0, max: v } : null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Catálogo</h1>
          <p className="text-gray-600">Explora nuestros productos personalizados — usa la búsqueda para encontrar rápido.</p>
        </div>

        {/* Buscador y filtros */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <input
              placeholder="Buscar producto, ej. 'pocillo', 'camiseta', 'navidad'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
          </div>

          {/* Slider de precios (debajo del buscador como pediste) */}
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600 w-40">Precio máximo:</label>
            <input
              type="range"
              min={0}
              max={1000000}
              step={1000}
              value={priceMax}
              onChange={onPriceSliderChange}
              className="flex-1"
            />
            <div className="w-36 text-right text-sm font-medium text-purple-600">
              {priceMax > 0 ? formatPrice(priceMax) : "Sin filtro"}
            </div>
          </div>
        </div>

        {error && <div className="text-red-600 mb-4">{error}</div>}

        {/* Estado de búsqueda */}
        <div className="mb-4 text-sm text-gray-600">
          {searching ? "Buscando..." : `${filteredProducts.length} producto(s) encontrados`}
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts && filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-gray-100 overflow-hidden">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={(product.images && product.images[0]) || "/placeholder.svg"}
                    alt={product.name || product.title || "Producto"}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">{product.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-500">{product.category}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xl font-bold text-purple-600">{formatPrice(product.basePrice ?? product.price)}</div>
                    <Badge className="bg-purple-100 text-purple-700">{product.tags?.[0] ?? ""}</Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{product.description}</p>

{/* reemplaza la sección de botones dentro de la tarjeta por esto */}
<div className="flex gap-2">
  <Button asChild className="w-full bg-pink-500 text-white hover:bg-pink-600 border-0">
    <Link href={`/catalogo/${product.id}`}>Ver</Link>
  </Button>
</div>


                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-600">
              {loading ? "Cargando productos..." : "No se encontraron productos con esos filtros."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
