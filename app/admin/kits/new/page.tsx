// app/admin/kits/new/page.tsx
"use client";

import React from "react";
import AdminLayout from "@/components/admin-layout";
import KitForm from "@/components/admin/KitForm";

export default function NewKitPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Crear Kit</h2>
          <p className="text-sm text-gray-500">Crea un nuevo kit para el catálogo.</p>
        </div>

        <KitForm />
      </div>
    </AdminLayout>
  );
}
