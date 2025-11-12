// app/admin/productos/[id]/edit/page.tsx
import React from "react";
import EditProductClient from "./edit";

/**
 * Genera los params en build para `output: "export"`.
 * Intenta leer la lista de productos desde la Realtime DB REST en NEXT_PUBLIC_FIREBASE_DATABASE_URL.
 * Si no hay URL o la lectura falla, devuelve vacío para evitar romper el build.
 */
export async function generateStaticParams() {
  const base = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!base) return [];

  try {
    // intenta leer /products.json (ajusta la ruta si tu recurso es distinto)
    const res = await fetch(`${base}/products.json`, { cache: "no-store" });
    if (!res.ok) return [];
    const body = await res.json();
    // body suele ser un objeto con keys -> products, ajusta según tu estructura
    if (!body) return [];
    // si body es objeto: extrae ids
    if (typeof body === "object") {
      return Object.keys(body).map((id) => ({ id }));
    }
    return [];
  } catch (err) {
    // si falla, devolvemos vacío para no romper el build
    return [];
  }
}

type Props = {
  // params puede venir como Promise en Next 15 (server component)
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  // Nota: no envolvemos con AdminLayout -- app/admin/layout.tsx aplica el layout automáticamente
  return (
    <div className="py-8">
      <EditProductClient id={id} />
    </div>
  );
}
