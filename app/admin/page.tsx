"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminLayout from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash, Edit, PlusCircle, Package, Trash2 } from "lucide-react";
import { fetchAllProducts, formatPrice } from "@/lib/products";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

type Product = {
  id: string;
  name?: string;
  basePrice?: number;
  description?: string;
  images?: string[];
  stock?: number;
  tags?: string[];
};

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const p = await fetchAllProducts();
      setProducts(p || []);
    } catch (err) {
      console.error("Error cargando productos", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    const ok = confirm("¿Seguro que quieres eliminar este producto? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      setDeletingId(id);
      // Usa deleteDoc directo si no tienes helper en lib/admin
      await deleteDoc(doc(db, "products", id));
      // Recarga la lista
      await load();
    } catch (err) {
      console.error("Error eliminando producto", err);
      alert("Ocurrió un error al eliminar. Revisa la consola.");
    } finally {
      setDeletingId(null);
    }
  }

  function whatsappLink(product: Product) {
    const text = `Hola, quiero cotizar este producto: ${product.name} (id: ${product.id}). Precio base: ${formatPrice(product.basePrice)}.`;
    const phone = process.env.NEXT_PUBLIC_ADMIN_PHONE || ""; // opcional si la tienes
    if (phone) return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
    // Si no hay teléfono usa el enlace web de WhatsApp sin número (abierto)
    return `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  }

  return (
    <AdminLayout>
      <div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-12">No hay productos. Agrega uno nuevo.</div>
          ) : (
            products.map((p) => (
              <Card key={p.id} className="group hover:shadow-xl transition-all duration-300">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={(p.images && p.images[0]) || "/placeholder.svg"}
                    alt={p.name || "Producto"}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{p.name}</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="mb-3">
                    <div className="text-xl font-bold text-purple-600">{formatPrice(p.basePrice)}</div>
                    <div className="text-xs text-muted mt-1">Stock: {p.stock ?? 0}</div>
                    <div className="text-xs text-muted mt-1">Etiqueta: {p.tags?.[0] ?? "-"}</div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{p.description}</p>

                  <div className="flex gap-2">
                    <Link href={`/admin/productos/${p.id}/edit`} className="btn-admin-small w-full inline-flex items-center justify-center">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Link>

                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="btn-admin-small-outline w-full inline-flex items-center justify-center"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deletingId === p.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <a href={whatsappLink(p)} target="_blank" rel="noreferrer" className="action-pill">
                      <Package className="w-4 h-4 mr-1" /> Enviar WhatsApp
                    </a>

                    <Link href={`/catalogo/${p.id}`} className="action-pill-outline">
                      Ver en catálogo
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
