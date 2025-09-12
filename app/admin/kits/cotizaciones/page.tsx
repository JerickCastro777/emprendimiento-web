// app/admin/cotizaciones/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/admin-layout";
import { fetchQuotes, updateQuoteStatus, addQuoteResponse, type Quote } from "@/lib/quotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [responseMap, setResponseMap] = useState<Record<string, string>>({});

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

  async function changeStatus(id: string, status: Quote["status"]) {
    const ok = await updateQuoteStatus(id, status);
    if (ok.ok) setRefreshKey((k) => k + 1);
    else alert("No se pudo actualizar estado");
  }

  async function sendResponse(id: string) {
    const text = responseMap[id] ?? "";
    if (!text.trim()) { alert("Escribe una respuesta antes."); return; }
    const res = await addQuoteResponse(id, text, "quoted");
    if (res.ok) {
      setResponseMap((m) => ({ ...m, [id]: "" }));
      setRefreshKey((k) => k + 1);
      alert("Respuesta guardada en la cotización.");
    } else {
      alert("No se pudo enviar la respuesta.");
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
          <p className="text-sm text-muted">Lista de solicitudes recibidas. Responde y administra el estado.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
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
              <Card key={q.id}>
                <CardHeader className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{q.customerName}</CardTitle>
                    <div className="text-sm text-gray-500">
                      {q.customerPhone ? `Tel: ${q.customerPhone}` : ""} {q.customerEmail ? ` • ${q.customerEmail}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(q.totalEstimate)}</div>
                    <div className="text-xs text-gray-500">{q.status}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <div className="font-medium mb-2">Productos:</div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {q.items?.map((it, idx) => (
                        <li key={idx}>
                          {it.name} x{it.qty} — {formatCurrency(it.basePrice)} c/u — {formatCurrency(it.total)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {q.message && (
                    <div className="mb-3 text-sm">
                      <div className="font-medium">Mensaje cliente:</div>
                      <div className="text-gray-700">{q.message}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex gap-2">
                      {q.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => changeStatus(q.id!, "processing")}>
                            Procesar
                          </Button>
                          <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => changeStatus(q.id!, "quoted")}>
                            Cotizar
                          </Button>
                        </>
                      )}

                      {q.status === "processing" && (
                        <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => changeStatus(q.id!, "quoted")}>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Cotización
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">ID: {q.id}</div>
                  </div>

                  {(q.status === "pending" || q.status === "processing") && (
                    <div>
                      <div className="font-medium mb-2">Responder al cliente</div>
                      <Textarea
                        rows={3}
                        value={responseMap[q.id!] ?? ""}
                        onChange={(e) => setResponseMap((m) => ({ ...m, [q.id!]: e.target.value }))}
                      />
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => sendResponse(q.id!)}>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar respuesta
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setResponseMap((m) => ({ ...m, [q.id!]: "" }))}>
                          Limpiar
                        </Button>
                      </div>
                    </div>
                  )}

                  {q.response && (
                    <div className="mt-4 text-sm">
                      <div className="font-medium">Respuesta enviada:</div>
                      <div className="text-gray-700">{q.response}</div>
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

/* pequeño helper para mostrar moneda */
function formatCurrency(value?: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value ?? 0);
}
