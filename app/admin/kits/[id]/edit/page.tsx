// app/kits/[id]/page.tsx
import KitClient from "./KitClient";

/** Genera los params en build usando Realtime DB REST (NEXT_PUBLIC_FIREBASE_DATABASE_URL) */
export async function generateStaticParams() {
  const base = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!base) return [];

  try {
    const res = await fetch(`${base}/kits.json`);
    if (!res.ok) {
      console.warn("generateStaticParams kits: fetch no OK", res.status);
      return [];
    }
    const data = await res.json();
    if (!data) return [];
    return Object.keys(data).map((id) => ({ id }));
  } catch (err) {
    console.error("generateStaticParams kits error:", err);
    return [];
  }
}

export default function KitPage({ params }: { params: { id: string } }) {
  return <KitClient kitId={params.id} />;
}
