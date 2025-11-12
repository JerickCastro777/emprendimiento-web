// app/admin/productos/[id]/edit/edit.tsx
"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin-layout";        // revisa que exista ese archivo
import ProductForm from "@/components/admin/ProductForm";  // revisa que exista y exporte default
import { fetchProductById, Product } from "@/lib/products";
import { useRouter } from "next/navigation";

type Props = {
  id?: string;
};

export default function EditProductClient({ id }: Props) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const p = await fetchProductById(id);
        if (!mounted) return;
        setProduct(p);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleSaved(savedId?: string) {
    // después de guardar, redirigir al listado de productos
    router.push("/admin/productos");
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {loading ? (
          <div>Cargando producto…</div>
        ) : (
          <ProductForm product={product ?? undefined} onSaved={handleSaved} />
        )}
      </div>
    </AdminLayout>
  );
}