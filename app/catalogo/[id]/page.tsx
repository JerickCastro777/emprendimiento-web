// app/catalogo/[id]/page.tsx
import AdminLayout from "@/components/admin-layout";// tu layout (ajusta nombre si es distinto)
import ProductDetailClient from "./ProductDetailClient";

/** Genera los params en build para output: "export" */
export async function generateStaticParams() {
  const base = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!base) return [];

  try {
    const res = await fetch(`${base}/catalogo.json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data) return [];
    return Object.keys(data).map((id) => ({ id }));
  } catch (err) {
    console.error("generateStaticParams catalogo error:", err);
    return [];
  }
}

/** Página server: envuelve el cliente con tu layout (AdminLayout) */
export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <AdminLayout>
      <ProductDetailClient itemId={id} />
    </AdminLayout>
  );
}
