// app/admin/cotizaciones/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin-layout";
import {
  fetchQuotes,
  updateQuoteStatus,
  addQuoteResponse,
  deleteQuote,
  type Quote,
} from "@/lib/quotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Send, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { fetchProductById } from "@/lib/products";

// Firestore direct helpers (para obtener datos de kits)
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Admin cotizaciones (safe with types)
 *
 * Cambios principales:
 * - Detecta productId con prefijo "kit:<id>" y carga datos del kit desde Firestore.
 * - Resuelve thumbs y nombres tanto para productos como para kits y sus productos incluidos.
 * - Añadidos estilos para que las cards mantengan alturas consistentes.
 */

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [responseMap, setResponseMap] = useState<Record<string, string>>({});
  const [thumbs, setThumbs] = useState<Record<string, string>>({}); // key puede ser "prodId" o "kit:kitId"
  const [kitMap, setKitMap] = useState<Record<string, any>>({}); // key "kit:kitId" => kit data
  const [productInfoMap, setProductInfoMap] = useState<Record<string, any>>({}); // productId => minimal product info

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const q = await fetchQuotes();
        if (!mounted) return;
        setQuotes(q);
      } catch (err) {
        console.error(err);
        setQuotes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  // Resolve thumbnails and small metadata for products and kits referenced inside las cotizaciones
  useEffect(() => {
    let mounted = true;

    async function resolveThumbsAndData() {
      if (!quotes || quotes.length === 0) return;

      const productIds = new Set<string>();
      const kitIds = new Set<string>();

      // Recolectar ids a resolver (productos directos y kits "kit:<id>")
      for (const q of quotes) {
        const items = (q as any).items ?? [];
        if (!Array.isArray(items)) continue;
        for (const it of items) {
          const pid = typeof it?.productId === "string" ? it.productId : null;
          if (!pid) continue;
          if (pid.startsWith("kit:")) {
            kitIds.add(pid.replace(/^kit:/, ""));
          } else {
            productIds.add(pid);
          }
        }
      }

      // si no hay nada, nada que hacer
      if (productIds.size === 0 && kitIds.size === 0) return;

      const nextThumbs: Record<string, string> = { ...thumbs };
      const nextKitMap: Record<string, any> = { ...kitMap };
      const nextProdInfo: Record<string, any> = { ...productInfoMap };

      const promises: Promise<void>[] = [];

      // resolver productos
      productIds.forEach((pid) => {
        if (nextThumbs[pid] || nextProdInfo[pid]) return;
        promises.push(
          (async () => {
            try {
              const prod = await fetchProductById(pid);
              if (prod) {
                nextProdInfo[pid] = prod;
                if (prod.images && prod.images.length > 0) {
                  nextThumbs[pid] = prod.images[0];
                } else if (prod.image) {
                  nextThumbs[pid] = prod.image;
                } else {
                  nextThumbs[pid] = "/placeholder.svg";
                }
              } else {
                nextThumbs[pid] = "/placeholder.svg";
              }
            } catch (err) {
              console.warn("Error fetching product for thumb:", pid, err);
              nextThumbs[pid] = "/placeholder.svg";
            }
          })()
        );
      });

      // resolver kits desde Firestore (colección 'kits')
      kitIds.forEach((kid) => {
        const key = `kit:${kid}`;
        if (nextThumbs[key] || nextKitMap[key]) return;
        promises.push(
          (async () => {
            try {
              const docRef = doc(db, "kits", kid);
              const snap = await getDoc(docRef);
              if (snap.exists()) {
                const kitData = { id: snap.id, ...(snap.data() as any) };
                nextKitMap[key] = kitData;

                // thumb del kit: preferir imagen explícita, luego images[0]
                const img = kitData.image ?? (Array.isArray(kitData.images) ? kitData.images[0] : undefined);
                nextThumbs[key] = img ?? "/placeholder.svg";

                // si el kit tiene productIds o items, intentar resolver sus productos para mostrar nombres/thumbs
                const innerIds: string[] = [];
                if (Array.isArray(kitData.productIds)) innerIds.push(...kitData.productIds.map((x: any) => String(x)));
                if (Array.isArray(kitData.items)) {
                  for (const it of kitData.items) {
                    const maybePid = it.productId ?? it.id ?? it.prodId ?? it.ref;
                    if (maybePid) innerIds.push(String(maybePid));
                  }
                }

                // quitar duplicados y lanzar fetch de cada producto incluido
                const uniqueInner = Array.from(new Set(innerIds));
                for (const innerId of uniqueInner) {
                  if (!nextProdInfo[innerId]) {
                    try {
                      const prod = await fetchProductById(innerId);
                      if (prod) {
                        nextProdInfo[innerId] = prod;
                        nextThumbs[innerId] = (prod.images && prod.images[0]) || prod.image || "/placeholder.svg";
                      } else {
                        nextThumbs[innerId] = nextThumbs[innerId] ?? "/placeholder.svg";
                      }
                    } catch (err) {
                      nextThumbs[innerId] = nextThumbs[innerId] ?? "/placeholder.svg";
                    }
                  }
                }
              } else {
                // no existe el kit
                nextKitMap[key] = null;
                nextThumbs[key] = "/placeholder.svg";
              }
            } catch (err) {
              console.warn("Error fetching kit:", kid, err);
              nextKitMap[key] = null;
              nextThumbs[key] = "/placeholder.svg";
            }
          })()
        );
      });

      await Promise.all(promises);
      if (!mounted) return;

      setThumbs((t) => ({ ...t, ...nextThumbs }));
      setKitMap((k) => ({ ...k, ...nextKitMap }));
      setProductInfoMap((p) => ({ ...p, ...nextProdInfo }));
    }

    resolveThumbsAndData();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes]);

  async function changeStatus(id: string, status: Quote["status"]) {
    const ok = await updateQuoteStatus(id, status);
    if (ok.ok) setRefreshKey((k) => k + 1);
    else alert("No se pudo actualizar estado");
  }

  async function sendResponse(id: string) {
    const text = responseMap[id] ?? "";
    if (!text.trim()) {
      alert("Escribe una respuesta antes.");
      return;
    }
    const res = await addQuoteResponse(id, text, "quoted");
    if (res.ok) {
      setResponseMap((m) => ({ ...m, [id]: "" }));
      setRefreshKey((k) => k + 1);
      alert("Respuesta guardada en la cotización.");
    } else {
      alert("No se pudo enviar la respuesta.");
    }
  }

  async function handleDelete(id: string) {
    const ok = confirm("¿Seguro que quieres eliminar esta cotización? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      const res = await deleteQuote(id);
      if (res.ok) {
        alert("Cotización eliminada.");
        setRefreshKey((k) => k + 1);
      } else {
        console.error("deleteQuote error:", res.error);
        alert("No se pudo eliminar la cotización. Revisa la consola.");
      }
    } catch (err) {
      console.error("Error al eliminar cotización:", err);
      alert("No se pudo eliminar la cotización. Revisa la consola.");
    }
  }

  function formatCurrency(value?: number) {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
      value ?? 0
    );
  }

  function renderProducts(q: Quote) {
    const items: any[] = (q as any).items ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      return <div className="text-sm text-gray-500">Sin productos</div>;
    }

    return (
      <ul className="space-y-3">
        {items.map((it: any, idx: number) => {
          // Detectar kit: productId puede ser 'kit:abc123'
          const pidRaw = typeof it?.productId === "string" ? it.productId : null;
          const isKit = typeof pidRaw === "string" && pidRaw.startsWith("kit:");
          let thumb = "/placeholder.svg";
          let name = it?.name ?? it?.title ?? it?.product?.name ?? "Producto";
          let qty = typeof it?.qty === "number" ? it.qty : typeof it?.quantity === "number" ? it.quantity : 1;
          let priceNum = typeof it?.basePrice === "number" ? it.basePrice : typeof it?.price === "number" ? it.price : 0;
          let subtotal = (typeof it?.total === "number" ? it.total : priceNum * qty) ?? 0;

          if (isKit && pidRaw) {
            const kid = pidRaw.replace(/^kit:/, "");
            const key = `kit:${kid}`;
            const kitData = kitMap[key];
            // thumb preferido (kit)
            thumb = thumbs[key] ?? "/placeholder.svg";
            // nombre y precio preferente del kit (kitPrice, kit.kitPrice, originalPrice, basePrice)
            name = kitData?.name ?? name;
            const kitPrice = Number(kitData?.kitPrice ?? kitData?.price ?? kitData?.basePrice ?? kitData?.originalPrice ?? 0) || 0;

            if (kitPrice > 0) {
              priceNum = kitPrice;
              subtotal = priceNum * qty;
            } else {
              // fallback: si item tiene total ya calculado lo usamos, si no intentamos sumar products incluidos (si kitData tiene productIds)
              if (!subtotal && kitData && Array.isArray(kitData.productIds) && kitData.productIds.length) {
                let sum = 0;
                for (const innerId of kitData.productIds) {
                  const pInfo = productInfoMap[innerId];
                  const pBase = Number(pInfo?.basePrice ?? pInfo?.price ?? 0) || 0;
                  sum += pBase;
                }
                if (sum > 0) {
                  priceNum = sum;
                  subtotal = sum * qty;
                }
              }
            }
          } else {
            // producto normal: buscar thumb resuelto o productInfoMap
            if (pidRaw) {
              thumb = thumbs[pidRaw] ?? thumbs[pidRaw] ?? "/placeholder.svg";
              const pInfo = productInfoMap[pidRaw];
              if (pInfo) {
                name = pInfo.name ?? name;
                if (!priceNum) priceNum = Number(pInfo.basePrice ?? pInfo.price ?? 0) || 0;
                subtotal = (it.total ?? priceNum * qty) ?? 0;
              }
            } else {
              // si no hay id, usar lo que venga en el item
              thumb = it.image ?? (Array.isArray(it.images) && it.images[0]) ?? "/placeholder.svg";
              subtotal = (it.total ?? priceNum * qty) ?? 0;
            }
          }

          return (
            <li key={idx} className="flex items-center gap-3">
              <img src={thumb} alt={name} className="w-12 h-12 object-cover rounded border" />
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-800">{name}</div>
                <div className="text-xs text-gray-500">
                  {qty > 1 ? `${qty} x ${formatCurrency(priceNum)} c/u` : `${formatCurrency(priceNum)}`}
                  {subtotal ? ` — ${formatCurrency(subtotal)}` : ""}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
          <p className="text-sm text-muted">Lista de solicitudes recibidas. Responde y administra el estado.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 auto-rows-fr items-stretch">
          {loading ? (
            <div>Cargando cotizaciones…</div>
          ) : quotes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">No hay cotizaciones</h3>
                <p className="text-gray-600">Aquí aparecerán las cotizaciones que envíen los clientes.</p>
              </CardContent>
            </Card>
          ) : (
            quotes.map((q) => (
              <Card key={(q as any).id ?? Math.random()} className="h-full flex flex-col">
                <CardHeader className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{(q as any).customerName ?? "Sin nombre"}</CardTitle>
                    <div className="text-sm text-gray-500">
                      {(q as any).customerPhone ? `Tel: ${(q as any).customerPhone}` : ""}{" "}
                      {(q as any).customerEmail ? ` • ${(q as any).customerEmail}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency((q as any).totalEstimate)}</div>
                    <div className="text-xs text-gray-500">{(q as any).status}</div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-3">
                    <div className="font-medium mb-2">Productos:</div>
                    <div>{renderProducts(q)}</div>
                  </div>

                  {(q as any).message && (
                    <div className="mb-3 text-sm">
                      <div className="font-medium">Mensaje cliente:</div>
                      <div className="text-gray-700">{(q as any).message}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex gap-2">
                      {(q as any).status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => changeStatus((q as any).id, "processing")}>
                            Procesar
                          </Button>
                          <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => changeStatus((q as any).id, "quoted")}>
                            Cotizar
                          </Button>
                        </>
                      )}

                      {(q as any).status === "processing" && (
                        <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => changeStatus((q as any).id, "quoted")}>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Cotización
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete((q as any).id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>

                  {((q as any).status === "pending" || (q as any).status === "processing") && (
                    <div>
                      <div className="font-medium mb-2">Responder al cliente</div>
                      <Textarea
                        rows={3}
                        value={responseMap[(q as any).id] ?? ""}
                        onChange={(e) => setResponseMap((m) => ({ ...m, [(q as any).id]: e.target.value }))}
                      />
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => sendResponse((q as any).id)}>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar respuesta
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setResponseMap((m) => ({ ...m, [(q as any).id]: "" }))}>
                          Limpiar
                        </Button>
                      </div>
                    </div>
                  )}

                  {(q as any).response && (
                    <div className="mt-4 text-sm">
                      <div className="font-medium">Respuesta enviada:</div>
                      <div className="text-gray-700">{(q as any).response}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
