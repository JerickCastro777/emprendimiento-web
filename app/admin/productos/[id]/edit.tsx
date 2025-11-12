// app/admin/productos/[id]/edit.tsx
"use client";

import React, { useEffect, useState } from "react";
import ProductForm from "@/components/admin/ProductForm";
import { fetchProductById, Product } from "@/lib/products";
import { useRouter } from "next/navigation";

type Props = {
  id?: string;
};

export default function EditProductClient({ id }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      if (!id) {
        setError("ID de producto no proporcionado.");
        setProduct(null);
        setLoading(false);
        return;
      }
      try {
        const p = await fetchProductById(id);
        if (!mounted) return;
        setProduct(p ?? null);
      } catch (err) {
        console.error("Error fetching product:", err);
        if (!mounted) return;
        setError("No se pudo cargar el producto.");
        setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleSaved(savedId?: string) {
    // redirige a la lista de productos o al detalle según prefieras
    router.push("/admin/productos");
  }

  if (loading) {
    return (
      <div className="p-6">
        <div>Cargando producto…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <div className="mt-4">
          <button
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={() => router.push("/admin/productos")}
          >
            Volver a productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <ProductForm product={product ?? undefined} onSaved={handleSaved} />
    </div>
  );
}
