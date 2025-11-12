// app/catalogo/[id]/page.tsx
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

/** Página server: params viene como Promise, por eso hacemos await */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailClient itemId={id} />;
}
