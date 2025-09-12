"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  const router = useRouter();

async function handleSaved(id?: string) {
  // opcional: puedes usar el id si lo necesitas:
  // console.log("producto creado id:", id);
  router.push("/admin/productos");
}

  return (
    <div className="p-6">
      <ProductForm onSaved={handleSaved} />
    </div>
  );
}
