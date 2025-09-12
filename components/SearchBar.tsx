// components/SearchBar.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import Link from "next/link";
import { fetchAllProducts } from "@/lib/products";

type SmallProduct = {
  id: string;
  name: string;
  images?: string[];
  basePrice?: number;
  category?: string;
  sku?: string;
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SmallProduct[]>([]);
  const [results, setResults] = useState<SmallProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const all = await fetchAllProducts();
        if (!mounted) return;
        // map to small product
        const small = all.map((p) => ({
          id: p.id,
          name: p.name,
          images: p.images ?? [],
          basePrice: p.basePrice ?? p.price ?? 0,
          category: p.category,
          sku: p.sku,
        }));
        setProducts(small);
      } catch (e) {
        console.error("SearchBar fetchAllProducts error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Fuse index
  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: ["name", "category", "sku"],
      threshold: 0.35,
      includeScore: true,
    });
  }, [products]);

  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      return;
    }
    const res = fuse.search(query.trim()).slice(0, 10).map((r) => r.item);
    setResults(res);
  }, [query, fuse]);

  return (
    <div className="relative w-full max-w-md">
      <input
        className="w-full border border-gray-200 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-200"
        placeholder={loading ? "Cargando productos..." : "Buscar productos, p.ej. 'pocillo', 'camiseta'"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-100 rounded-md shadow-lg max-h-64 overflow-auto">
          <ul>
            {results.map((p) => (
              <li key={p.id} className="px-3 py-2 hover:bg-gray-50">
                <Link href={`/catalogo/${p.id}`} className="flex items-center gap-3">
                  <img
                    src={(p.images && p.images[0]) || "/placeholder.svg"}
                    alt={p.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.category ?? p.sku}</div>
                  </div>
                  <div className="text-sm text-gray-700">{p.basePrice ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(p.basePrice) : ""}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {query && results.length === 0 && !loading && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-100 rounded-md shadow-lg p-3 text-sm text-gray-500">
          No se encontraron productos
        </div>
      )}
    </div>
  );
}
