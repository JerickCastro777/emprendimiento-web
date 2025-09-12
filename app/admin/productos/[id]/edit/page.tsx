// app/admin/productos/[id]/edit/page.tsx
import React from "react";
import EditProductClient from "./edit";

type Props = {
  // params viene como Promise en Next 15+
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params; // <-- await aquí
  return <EditProductClient id={id} />;
}
