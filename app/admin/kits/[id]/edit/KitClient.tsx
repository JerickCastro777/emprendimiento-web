// app/kits/[id]/KitClient.tsx
"use client";
import React, { useEffect, useState } from "react";
import { getKitById, formatPrice } from "@/lib/products"; // ajusta si tu función se llama distinto

type Props = { kitId: string };

export default function KitClient({ kitId }: Props) {
  const [item, setItem] = useState<any | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!kitId) { setItem(null); setLoading(false); return; }
      setLoading(true);
      try {
        // Reemplaza getKitById por la función correcta de tu lib
        const data = typeof getKitById === "function" ? await getKitById(kitId) : await (await fetch(`/api/kits/${kitId}`)).json();
        if (!cancelled) setItem(data ?? null);
      } catch (err) {
        console.error(err);
        if (!cancelled) { setError("No se pudo cargar el kit."); setItem(null); }
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [kitId]);

  if (loading || item === undefined) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!item) return <div>Item no encontrado</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">{item.name}</h1>
      <p className="text-lg text-red-600">{formatPrice(item.basePrice ?? item.price)}</p>
    </div>
  );
}
