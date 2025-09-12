// app/admin/productos/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash, Edit, PlusCircle } from "lucide-react";
import AdminLayout from "@/components/admin-layout";
import { fetchAllProducts, formatPrice, type Product } from "@/lib/products";
import { deleteProduct } from "@/lib/admin";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const p = await fetchAllProducts();
      setProducts(p);
    } catch (e) {
      console.error("Error cargando productos:", e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar producto? Esta acción es irreversible.")) return;
    setDeletingId(id);
    try {
      await deleteProduct(id);
      // recargar lista
      await load();
    } catch (e) {
      console.error("delete error:", e);
      alert("No se pudo eliminar el producto.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Productos</h1>
            <p className="text-sm text-gray-600">Aquí puedes crear, editar o eliminar productos.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-10">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-10">No hay productos aún.</div>
          ) : (
            products.map((p) => (
              <Card key={p.id} className="group hover:shadow-lg transition-all">
                <CardHeader className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <p className="text-sm text-gray-500">{p.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{formatPrice(p.basePrice)}</div>
                    <Badge className="mt-2">{p.tags?.[0] ?? ""}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{p.description}</p>

                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/admin/productos/${p.id}/edit`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Link>
                    </Button>

                    <Button
                      variant="destructive"
                      className="w-36"
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                    >
                      {deletingId === p.id ? "Eliminando..." : <><Trash className="w-4 h-4 mr-2" />Eliminar</>}
                    </Button>
                  </div>

                  <div className="mt-3 text-sm text-gray-600">
                    <div>Stock: <strong>{typeof p.stock === "number" ? p.stock : "—"}</strong></div>
                    <div className="mt-1">ID: <span className="text-xs text-muted-foreground">{p.id}</span></div>
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
