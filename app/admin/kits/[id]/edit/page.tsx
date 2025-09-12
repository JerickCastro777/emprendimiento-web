"use client";

import React from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/admin-layout";
import KitEditForm from "@/components/admin/KitEditForm";

export default function AdminKitEditPage() {
  const params = useParams() as { id?: string } | null;
  const id = params?.id ?? null;

  if (!id) {
    return (
      <AdminLayout>
        <div className="p-8">ID de kit inválido.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-8">
        <KitEditForm kitId={id} />
      </div>
    </AdminLayout>
  );
}
