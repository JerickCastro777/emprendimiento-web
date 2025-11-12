// app/admin/kits/[id]/edit/page.tsx
import React from "react";
import AdminKitEditClient from "./AdminKitEditClient"; // <-- componente del admin correct
import AdminLayout from "@/components/admin-layout";

export async function generateStaticParams() {
  const base = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!base) return [];
  try {
    const res = await fetch(`${base}/kits.json`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data) return [];
    return Object.keys(data).map((id) => ({ id }));
  } catch (err) {
    console.error("generateStaticParams kits error:", err);
    return [];
  }
}

/** Página server: await params (Next v15+ passes params as Promise) */
export default async function KitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Pasamos el id al cliente admin que contiene el formulario de edición
  return (
    <AdminLayout>
      <div className="py-6">
        <AdminKitEditClient kitId={id} />
      </div>
    </AdminLayout>
  );
}
