// app/kits/page.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Package, Percent, ArrowRight } from "lucide-react";
import { getKits, calculateKitSavings, formatPrice } from "@/lib/products";
import { Header } from "@/components/header";
import KitsLoading from "@/app/kits/loading";
import { useEffect, useState } from "react";
import type { Kit } from "@/lib/products";

export default function KitsPage() {
  const [kits, setKits] = useState<Kit[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await getKits();
        if (!mounted) return;
        setKits(res);
      } catch (e: any) {
        console.error("Error loading kits:", e);
        setError("No se pudieron cargar los kits. Intenta recargar la página.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <KitsLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Kits Especiales</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Combos perfectos para ocasiones especiales. Ahorra dinero comprando productos complementarios juntos.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 text-center text-red-600">
            {error}
          </div>
        )}

        {/* Kits Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {kits && kits.length > 0 ? (
            kits.map((kit) => {
              const savings = calculateKitSavings(kit);

              return (
                <Card
                  key={kit.id}
                  className="group hover:shadow-xl transition-all duration-300 border-purple-100 overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={kit.image || "/placeholder.svg"}
                      alt={kit.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Eliminado el badge verde de descuento */}
                    {kit.featured && (
                      <Badge className="absolute top-4 left-4 bg-purple-500 hover:bg-purple-600 text-white">
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span className="text-xs">Destacado</span>
                        </div>
                      </Badge>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="text-2xl text-purple-600 group-hover:text-purple-700 transition-colors">
                      {kit.name}
                    </CardTitle>
                    <CardDescription className="text-base">{kit.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Products in Kit */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Incluye:</h4>
                      <div className="space-y-2">
                        {kit.products && kit.products.length > 0 ? (
                          kit.products.map((product) => (
                            <div key={product.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                              <img
                                src={product.images && product.images[0] ? product.images[0] : "/placeholder.svg"}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-gray-600">{formatPrice(product.basePrice)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500">Productos no disponibles</div>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Precio individual:</span>
                        <span className="text-sm line-through text-gray-500">{formatPrice(kit.originalPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Precio del kit:</span>
                        <span className="text-xl font-bold text-purple-600">{formatPrice(kit.kitPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-600">Ahorras:</span>
                        <span className="text-lg font-bold text-green-600">{formatPrice(savings)}</span>
                      </div>
                    </div>

                    {/* Actions: ELIMINADO "Agregar Kit al Carrito". 
                        "Ver Detalles" mantiene estilo tipo gradient (igual que antes era el botón "Agregar") */}
                    <div className="space-y-3">
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        <Link href={`/kits/${kit.id}`}>
                          <div className="flex items-center justify-center">
                            Ver Detalles del Kit
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </div>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center text-gray-600">No hay kits disponibles por el momento.</div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-lg p-8 shadow-sm border border-purple-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">¿No encuentras el kit perfecto?</h3>
          <p className="text-gray-600 mb-6">Contáctanos y crearemos un kit personalizado especialmente para ti</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-red-500 hover:bg-red-600">
              <Link href="/cotizacion">
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-2" />
                  Solicitar Kit Personalizado
                </div>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50 bg-transparent"
            >
              <Link href="/catalogo">Ver Productos Individuales</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
