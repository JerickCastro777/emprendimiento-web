// app/admin/kits/[id]/edit/AdminKitEditClient.tsx
"use client";

import React from "react";
import KitEditForm from "@/components/admin/KitEditForm"; // ajusta esta ruta si tu KitEditForm está en otra carpeta

type Props = {
  kitId: string;
};

export default function AdminKitEditClient({ kitId }: Props) {
  if (!kitId) {
    return <div className="p-8">ID de kit inválido.</div>;
  }

  return (
    <div>
      {/* Tu componente real que maneja el formulario */}
      <KitEditForm kitId={kitId} />
    </div>
  );
}
