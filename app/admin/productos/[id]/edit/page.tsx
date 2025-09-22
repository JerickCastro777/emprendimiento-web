// app/admin/productos/[id]/edit/page.tsx
import React from "react"; // ruta relativa desde este archivo hasta components/ui
import AdminLayout from "@/components/admin-layout";
import EditProductClient from "./edit";

/**
 * Genera los params en build para `output: "export"`.
 * Intenta leer la lista de productos desde la Realtime DB REST en NEXT_PUBLIC_FIREBASE_DATABASE_URL.
 * Si no hay URL o la lectura falla, devuelve vacío para evitar romper el build.
 *
 * Si tu DB requiere auth, usa la variante temporal (comentada abajo).
 */
export async function generateStaticParams() {
  const base = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!base) {
    // No hay URL configurada -> devolvemos vacío
    return [];
  }

  try {
    const res = await fetch(`${base}/productos.json`);
    if (!res.ok) {
      console.warn("generateStaticParams: fetch productos.json no OK", res.status);
      return [];
    }
    const data = await res.json();
    if (!data) return [];
    return Object.keys(data).map((id) => ({ id }));
  } catch (err) {
    console.error("generateStaticParams productos error:", err);
    return [];
  }

  // ----- Variante temporal (descomenta si tu DB no es accesible en build) -----
  // return [{ id: "demo-1" }, { id: "demo-2" }];
}

type Props = {
  // params puede venir como Promise en Next 15 (server component)
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  return (
    <AdminLayout>
      <div className="py-8">
        <EditProductClient id={id} />
      </div>
    </AdminLayout>
  );
}
