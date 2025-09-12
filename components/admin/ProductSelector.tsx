// components/admin/ProductSelector.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchAllProducts, formatPrice, Product } from "@/lib/products";

type Props = {
  value?: string[];
  onChange?: (ids: string[]) => void;
  pageSize?: number;
  productsProp?: Product[];
};

export default function ProductSelector({ value = [], onChange, pageSize = 8, productsProp }: Props) {
  const [products, setProducts] = useState<Product[]>(productsProp ?? []);
  const [loading, setLoading] = useState<boolean>(!productsProp);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>(value ?? []);

  useEffect(() => {
    setSelected(value ?? []);
  }, [value]);

  // fetch cuando no viene productsProp
  useEffect(() => {
    let mounted = true;
    if (!productsProp) {
      setLoading(true);
      fetchAllProducts()
        .then((res) => {
          if (!mounted) return;
          setProducts(res);
        })
        .catch((err) => {
          console.error("ProductSelector: error fetching products", err);
        })
        .finally(() => mounted && setLoading(false));
    } else {
      setProducts(productsProp);
    }
    return () => {
      mounted = false;
    };
  }, [productsProp]);

  // comunicar cambios de selección sin hacerlo dentro de un setState sync
  useEffect(() => {
    onChange?.(selected);
  }, [selected, onChange]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const tags = (p.tags || []).join(" ").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return name.includes(q) || sku.includes(q) || tags.includes(q) || desc.includes(q);
    });
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const visibleItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
  }

  function selectAllVisible() {
    const ids = visibleItems.map((p) => p.id);
    const merged = Array.from(new Set([...selected, ...ids]));
    setSelected(merged);
  }

  function clearSelection() {
    setSelected([]);
  }

  function thumbFor(p: Product) {
    if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
    if (p.image) return p.image as string;
    return "/placeholder.svg";
  }

  function priceFor(p: Product) {
    if (typeof p.basePrice === "number" && p.basePrice > 0) return formatPrice(p.basePrice);
    if (typeof p.basePrice === "string") return p.basePrice;
    return "$0";
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Buscar productos por nombre, sku, tag..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <button type="button" onClick={selectAllVisible} className="px-3 py-2 bg-purple-500 text-white rounded">
          Seleccionar visibles
        </button>
        <button type="button" onClick={clearSelection} className="px-3 py-2 border rounded">
          Limpiar
        </button>
      </div>

      <div className="mb-2 text-sm text-gray-500">{loading ? "Cargando productos..." : `${filtered.length} producto(s) encontrados`}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {loading ? (
          Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse rounded" />
          ))
        ) : visibleItems.length === 0 ? (
          <div className="text-sm text-gray-500 col-span-full">No hay productos.</div>
        ) : (
          visibleItems.map((p) => {
            const isSelected = selected.includes(p.id);
            const thumb = thumbFor(p);
            const price = priceFor(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={`relative flex items-center gap-3 p-3 rounded border transition-shadow text-left
                  ${isSelected ? "ring-2 ring-purple-400 shadow-md bg-white" : "bg-white hover:shadow-sm"}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(p.id)}
                  className="w-4 h-4"
                  onClick={(e) => e.stopPropagation()}
                />

                <img src={thumb} alt={p.name} className="w-12 h-12 object-cover rounded bg-gray-50" loading="lazy" />

                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-500">{price}</div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Página {page} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page === 1}
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page === totalPages}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
