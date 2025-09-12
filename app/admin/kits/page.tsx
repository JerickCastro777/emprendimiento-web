"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin-layout";
import { getKits, calculateKitSavings, type Kit } from "@/lib/products";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";

export default function AdminKitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const k = await getKits();
        if (!mounted) return;
        setKits(k);
      } catch (e) {
        console.error(e);
        setKits([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleDelete(id: string) {
    const ok = confirm("¿Eliminar este kit? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "kits", id));
      setKits((prev) => prev.filter((k) => k.id !== id));
      alert("Kit eliminado.");
    } catch (err) {
      console.error("Error eliminando kit:", err);
      alert("Error al eliminar. Revisa la consola.");
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kits</h1>
            <p className="text-sm text-gray-600">Combos y paquetes — administra aquí.</p>
          </div>
<div>
  <Button asChild>
    <Link
      href="/admin/kits/new"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white bg-gradient-to-br from-pink-500 to-rose-500 shadow-md hover:brightness-95 transform hover:-translate-y-0.5 transition"
      aria-label="Crear nuevo kit"
    >
      {/* si tienes un icono puedes ponerlo aquí, por ejemplo: <Plus className="w-4 h-4" /> */}
      Nuevo kit
    </Link>
  </Button>
</div>
        </div>

        {loading ? <div>Cargando kits...</div> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kits.map(k => (
              <Card key={k.id} className="overflow-hidden">
                <div>
                  {k.image ? (
                    // imagen arriba si existe
                    <div className="h-40 w-full relative">
                      <img src={k.image} alt={k.name} className="w-full h-40 object-cover" />
                    </div>
                  ) : null}
                </div>

                <CardHeader>
                  <CardTitle className="text-lg">{k.name}</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="mb-3 text-sm text-gray-700">{k.description}</div>
                  <div className="mb-3 text-sm">Ahorro: {calculateKitSavings(k)}</div>

                  <div className="flex gap-2">
                    <Link href={`/admin/kits/${k.id}/edit`} className="px-3 py-1 border rounded text-sm bg-white">
                      Editar
                    </Link>
                    <button onClick={() => handleDelete(k.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm">
                      Eliminar
                    </button>
                    <Link href={`/kits/${k.id}`} className="ml-auto px-3 py-1 border rounded text-sm bg-white">
                      Ver web
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
            {kits.length === 0 && <div>No hay kits aún.</div>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
