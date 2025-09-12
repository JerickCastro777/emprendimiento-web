// app/admin/productos/new/page.tsx
"use client";

import React from "react";
import AdminLayout from "@/components/admin-layout";
import ProductForm from "@/components/admin/ProductForm";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();

  // handler que puede ser async — ahora encaja con ProductForm prop
  async function handleSaved(id?: string) {
    // si quieres redirigir a la página de edición del producto recién creado:
    if (id) {
      router.push(`/admin/productos/${id}/edit`);
    } else {
      router.push("/admin/productos");
    }
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Nuevo producto</h1>
        <ProductForm onSaved={handleSaved} />
      </div>
    </AdminLayout>
  );
}
