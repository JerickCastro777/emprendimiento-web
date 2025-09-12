// app/admin/productos/[id]/edit.tsx
"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin-layout";
import ProductForm from "@/components/admin/ProductForm";
import { fetchProductById, Product } from "@/lib/products";
import { useRouter } from "next/navigation";

export default function EditProductPage() {
  const router = useRouter();

  // obtenemos id de la URL (aquí usamos el fallback simple)
  const params = (typeof window !== "undefined" ? window.location.pathname.split("/") : []);
  const id = params[params.length - 2] || "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return setLoading(false);
      try {
        const p = await fetchProductById(id);
        if (!mounted) return;
        setProduct(p);
      } catch (err) {
        console.error("fetch product error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  async function handleSaved(savedId?: string) {
    // redirigir al listado (o a la edición del mismo producto)
    router.push("/admin/productos");
  }

  if (!id) {
    return (
      <AdminLayout>
        <div className="p-6">ID del producto no encontrado en la URL.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6">
        {loading ? <div>Cargando...</div> : <ProductForm product={product} onSaved={handleSaved} />}
      </div>
    </AdminLayout>
  );
}
