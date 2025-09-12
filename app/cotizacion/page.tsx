"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Heart, ArrowLeft, Plus, Trash2, Calculator, Send, Package, Calendar, Clock } from "lucide-react";
import { fetchAllProducts, mockProducts, formatPrice, type Product } from "@/lib/products";
import { createQuote as createQuoteInLib } from "@/lib/quotes";

import { addDoc, collection, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ------------------ Tipos ------------------ */
type Kit = {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  image?: string;
  basePrice?: number;
  items?: Array<{ productId?: string; id?: string; quantity?: number; qty?: number; [k: string]: any }>;
  [k: string]: any;
};

export type QuoteItem = {
  productId: string;
  productName?: string;
  category?: string;
  quantity: number;
  basePrice: number;
  totalPrice: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedMaterial?: string;
  customMessage?: string;
};
/* ------------------------------------------- */

/* helper para cerrar dropdown al hacer click fuera */
function useOutsideClick<T extends HTMLElement = HTMLElement>(ref: React.RefObject<T>, handler: () => void) {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) handler();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [ref, handler]);
}

/* ------------------ UTIL: parseNumberFromValue ------------------ */
function parseNumberFromValue(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.,-]/g, "");
    if (!cleaned) return null;
    const hasDot = cleaned.indexOf(".") !== -1;
    const hasComma = cleaned.indexOf(",") !== -1;
    let normalized = cleaned;
    if (hasDot && hasComma) {
      const lastDot = cleaned.lastIndexOf(".");
      const lastComma = cleaned.lastIndexOf(",");
      if (lastComma > lastDot) {
        normalized = cleaned.replace(/\./g, "").replace(",", ".");
      } else {
        normalized = cleaned.replace(/,/g, "");
      }
    } else if (hasComma && !hasDot) {
      normalized = cleaned.replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
    const num = Number(normalized);
    if (!Number.isNaN(num)) return num;
    return null;
  }

  if (typeof v === "object") {
    for (const k of Object.keys(v)) {
      const maybe = parseNumberFromValue((v as any)[k]);
      if (maybe !== null) return maybe;
    }
  }

  return null;
}

/* ------------------ UTIL: extractPriceFromKit ------------------ */
function extractPriceFromKit(kit: any): { price: number; reason?: string } {
  if (!kit) return { price: 0, reason: "no-kit" };

  const keyCandidates = [
    "kitPrice",
    "kit_price",
    "salePrice",
    "sale_price",
    "finalPrice",
    "final_price",
    "precioFinal",
    "precio_final",
    "price",
    "basePrice",
    "base_price",
    "amount",
    "total",
    "cost",
    "valor",
    "originalPrice",
    "original_price",
  ];

  for (const key of keyCandidates) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let cur: any = kit;
      let found = true;
      for (const p of parts) {
        if (cur && typeof cur === "object" && p in cur) cur = cur[p];
        else {
          found = false;
          break;
        }
      }
      if (found) {
        const parsed = parseNumberFromValue(cur);
        if (parsed !== null) return { price: parsed, reason: `found ${key}` };
      }
    } else {
      if (key in kit) {
        const parsed = parseNumberFromValue((kit as any)[key]);
        if (parsed !== null) return { price: parsed, reason: `found ${key}` };
      }
    }
  }

  // shallow search for relevant keys
  for (const k of Object.keys(kit)) {
    if (/sale|final|price|precio|total|amount|cost|valor|kitprice/i.test(k)) {
      const parsed = parseNumberFromValue((kit as any)[k]);
      if (parsed !== null) return { price: parsed, reason: `found key ${k}` };
    }
  }

  // deep search limited
  const visited = new WeakSet();
  function deepSearch(obj: any, depth = 0): number | null {
    if (!obj || depth > 4) return null;
    if (typeof obj !== "object") return parseNumberFromValue(obj);
    if (visited.has(obj)) return null;
    visited.add(obj);

    for (const k of Object.keys(obj)) {
      if (/sale|final|price|precio|total|amount|cost|valor|kitprice/i.test(k)) {
        const val = (obj as any)[k];
        const parsed = parseNumberFromValue(val);
        if (parsed !== null) return parsed;
      }
    }

    for (const k of Object.keys(obj)) {
      const v = (obj as any)[k];
      if (Array.isArray(v)) {
        for (const it of v) {
          const p = deepSearch(it, depth + 1);
          if (p !== null) return p;
        }
      } else if (typeof v === "object") {
        const p = deepSearch(v, depth + 1);
        if (p !== null) return p;
      } else {
        const p = parseNumberFromValue(v);
        if (p !== null) return p;
      }
    }
    return null;
  }

  const deep = deepSearch(kit, 0);
  if (deep !== null) return { price: deep, reason: "deepSearch" };

  if (Array.isArray(kit.items) && kit.items.length) {
    return { price: 0, reason: "has-items" };
  }

  return { price: 0, reason: "not-found" };
}

/* ------------------ UTIL: computeKitBasePrice ------------------ */
function computeKitBasePrice(kit: any, products: Product[]): number {
  if (!kit) return 0;

  const ext = extractPriceFromKit(kit);
  if (ext.price && ext.price > 0) return ext.price;

  if (Array.isArray(kit.items) && kit.items.length) {
    let sum = 0;
    for (const it of kit.items) {
      const pid = it.productId || it.id || it.product || it.ref || it.refId;
      const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
      if (!pid) continue;
      const prod = (products || []).find((p) => p.id === pid) ?? mockProducts.find((p) => p.id === pid);
      const unit = prod ? Number(prod.basePrice ?? prod.price ?? 0) || 0 : 0;
      sum += unit * qty;
    }
    if (sum > 0) return sum;
  }

  const numbers: number[] = [];
  function collectNumbers(obj: any, depth = 0) {
    if (!obj || depth > 4) return;
    if (typeof obj === "number") numbers.push(obj);
    if (typeof obj === "string") {
      const n = parseNumberFromValue(obj);
      if (n !== null) numbers.push(n);
    } else if (typeof obj === "object") {
      for (const k of Object.keys(obj)) collectNumbers((obj as any)[k], depth + 1);
    }
  }
  collectNumbers(kit, 0);
  if (numbers.length) {
    const candidate = Math.max(...numbers.filter((n) => n > 0));
    if (candidate && isFinite(candidate)) return candidate;
  }

  return 0;
}

/* ------------------ SearchableItemSelect (productos + kits) ------------------ */
function SearchableItemSelect({
  products,
  kits,
  value,
  onSelect,
  placeholder = "Buscar producto o kit por nombre, sku o tag...",
}: {
  products: Product[];
  kits: Kit[];
  value?: string;
  onSelect: (item: { id: string; name: string; type: "product" | "kit"; basePrice?: number; images?: string[]; description?: string } | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useOutsideClick(ref, () => setOpen(false));

  const normalize = (s?: string) => (s || "").toLowerCase();

  const unified = React.useMemo(() => {
    const prods = (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      type: "product" as const,
      basePrice: Number(p.basePrice ?? p.price ?? p.precio ?? p.ahorro ?? p.total ?? 0) || 0,
      images: Array.isArray(p.images) && p.images.length ? p.images : p.image ? [p.image] : [],
      description: p.description ?? "",
      sku: p.sku,
      category: p.category,
      tags: p.tags,
    }));

    const k = (kits || []).map((kt) => {
      const images = Array.isArray((kt as any).images) && (kt as any).images.length
        ? (kt as any).images
        : ((kt as any).image ? [(kt as any).image] : []);

      const ext = extractPriceFromKit(kt);
      let basePrice = ext.price && ext.price > 0 ? ext.price : 0;
      if (basePrice === 0 && Array.isArray(kt.items) && kt.items.length) {
        basePrice = computeKitBasePrice(kt, products);
      }

      return {
        id: kt.id,
        name: kt.name,
        type: "kit" as const,
        basePrice: Number(basePrice) || 0,
        images,
        description: kt.description ?? (kt as any).desc ?? "",
        _debugExtract: ext.reason || "none",
      };
    });

    return [...prods, ...k];
  }, [products, kits]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return unified.slice(0, 30);
    return unified
      .filter((it) => {
        const inName = normalize(it.name).includes(q);
        const inSku = (it as any).sku ? normalize((it as any).sku).includes(q) : false;
        const inTags = Array.isArray((it as any).tags) && (it as any).tags.some((t: any) => normalize(t).includes(q));
        const inDesc = normalize(it.description).includes(q);
        return inName || inSku || inTags || inDesc;
      })
      .slice(0, 40);
  }, [unified, query]);

  const selected = unified.find((u) => {
    if (!value) return false;
    if (value.startsWith("kit:")) return u.type === "kit" && value === `kit:${u.id}`;
    return u.type === "product" && u.id === value;
  });

  return (
    <div className="relative" ref={ref}>
      <input
        className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
        placeholder={placeholder}
        value={open ? query : selected ? `${selected.name} ${selected.type === "kit" ? "(Kit)" : ""}` : query}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        aria-autocomplete="list"
      />

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No se encontraron items</div>
          ) : (
            filtered.map((it) => (
              <button
                key={`${it.type}-${it.id}`}
                type="button"
                onClick={() => {
                  onSelect(it);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full text-left px-3 py-3 hover:bg-purple-50 flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {it.images && it.images[0] ? (
                    <img src={it.images[0]} className="object-cover w-full h-full" alt={it.name} />
                  ) : (
                    <div className="text-xs text-gray-400">img</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{it.name}</div>
                    <div className="text-xs text-gray-500">{formatPrice(it.basePrice ?? 0)}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="uppercase text-[10px] px-2 py-[2px] rounded bg-gray-100 mr-2">{it.type === "kit" ? "Kit" : "Producto"}</span>
                  </div>
                  <div className="text-xs text-gray-400 line-clamp-2 mt-1 hidden sm:block">{it.description}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
/* -------------------------------------------------------------------------- */

/* ------------------ UTIL: removeUndefined ------------------ */
function removeUndefined(obj: any): any {
  if (obj === null) return null;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  if (typeof obj !== "object") return obj;

  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "undefined") continue;
    if (v === null) {
      out[k] = null;
      continue;
    }
    if (Array.isArray(v)) {
      out[k] = v.map(removeUndefined);
      continue;
    }
    if (v && typeof v === "object") {
      out[k] = removeUndefined(v);
      continue;
    }
    out[k] = v;
  }
  return out;
}
/* -------------------------------------------------------------------------- */

export default function CotizacionPage() {
  const router = useRouter();

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    eventDate: "",
    eventType: "",
  });

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [specialRequests, setSpecialRequests] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "urgent" | "express">("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingKits, setLoadingKits] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingProducts(true);
      setLoadingKits(true);

      let allProducts: Product[] | null = null;

      try {
        allProducts = await fetchAllProducts();
        if (!mounted) return;
        setProducts(allProducts && allProducts.length > 0 ? allProducts : mockProducts);
      } catch (err) {
        console.warn("fetchAllProducts failed, using mock:", err);
        setProducts(mockProducts);
      } finally {
        if (mounted) setLoadingProducts(false);
      }

      try {
        const snap = await getDocs(collection(db, "kits"));
        const arr: Kit[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        if (mounted) setKits(arr);

        const productsToUse = allProducts ?? (products.length ? products : mockProducts);
        const sample = arr.slice(0, 6).map((k) => {
          const ext = extractPriceFromKit(k);
          const computed = computeKitBasePrice(k, productsToUse);
          return { id: k.id, name: k.name, extReason: ext.reason, extPrice: ext.price, computed };
        });

        console.log("KITS cargados (ejemplo):", arr.slice(0, 6));
        console.log("KITS debug sample (extraction):", sample);
      } catch (err) {
        console.warn("fetching kits failed:", err);
        if (mounted) setKits([]);
      } finally {
        if (mounted) setLoadingKits(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  function getProductByIdLocal(id: string): Product | Kit | null {
    if (!id) return null;
    if (id.startsWith("kit:")) {
      const kitId = id.replace(/^kit:/, "");
      const k = kits.find((x) => x.id === kitId);
      return k ?? null;
    } else {
      const found = products.find((p) => p.id === id) ?? mockProducts.find((p) => p.id === id);
      return found ?? null;
    }
  }

  function generateQuoteId() {
    const now = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 8);
    return `q_${now}_${rnd}`;
  }

  function calculateQuoteTotal(items: QuoteItem[]) {
    return items.reduce(
      (acc, it) =>
        acc +
        (typeof it.totalPrice === "number" && it.totalPrice > 0 ? it.totalPrice : (it.basePrice ?? 0) * (it.quantity ?? 1)),
      0
    );
  }

  const addQuoteItem = () => {
    const newItem: QuoteItem = {
      productId: "",
      productName: "",
      category: "",
      quantity: 1,
      basePrice: 0,
      totalPrice: 0,
    };
    setQuoteItems((prev) => [...prev, newItem]);
  };

  const updateQuoteItem = <K extends keyof QuoteItem>(index: number, field: K, value: QuoteItem[K]) => {
    setQuoteItems((prev) => {
      const updatedItems = [...prev];
      const current = { ...updatedItems[index] } as QuoteItem;

      (current as any)[field] = value;

      if (field === "productId" && typeof value === "string" && value) {
        const resolved = getProductByIdLocal(value);
        if (resolved) {
          if (typeof value === "string" && value.startsWith("kit:")) {
            const kit = resolved as any;

            const ext = extractPriceFromKit(kit);
            let kitPrice = ext.price && ext.price > 0 ? ext.price : 0;

            if (!kitPrice) {
              const alt =
                Number(kit.kitPrice ?? kit.basePrice ?? kit.price ?? kit.precio ?? kit.salePrice ?? kit.specialPrice ?? kit.ahorro ?? kit.total ?? 0) || 0;
              if (alt > 0) kitPrice = alt;
            }

            if ((kitPrice === 0 || Number.isNaN(kitPrice)) && Array.isArray(kit.items) && kit.items.length) {
              kitPrice = computeKitBasePrice(kit, products);
            }

            current.productName = kit.name ?? "";
            current.category = kit.category ?? "Kit";
            current.basePrice = Number(kitPrice) || 0;
            current.totalPrice = (current.basePrice ?? 0) * (current.quantity ?? 1);

            console.log(`KIT selected: id=${kit.id} name="${kit.name}" extReason=${ext.reason} extPrice=${ext.price} finalUsed=${kitPrice}`);
          } else {
            const prod = resolved as Product;
            current.productName = prod.name ?? "";
            current.category = prod.category ?? "";
            current.basePrice = Number(prod.basePrice ?? prod.price ?? 0) || 0;
            current.totalPrice = (current.basePrice ?? 0) * (current.quantity ?? 1);
          }
        } else {
          current.productName = "";
          current.category = "";
          current.basePrice = 0;
          current.totalPrice = 0;
        }
      }

      if (field === "quantity") {
        const qty = Number(value as unknown) || 1;
        current.quantity = qty;
        current.totalPrice = (current.basePrice ?? 0) * qty;
      }

      updatedItems[index] = current;
      return updatedItems;
    });
  };

  const removeQuoteItem = (index: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalEstimate = calculateQuoteTotal(quoteItems);

  /* ------------------------ AQUI: HANDLE SUBMIT CORREGIDO ------------------------ */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || quoteItems.length === 0) {
      alert("Por favor completa los campos obligatorios y añade al menos un producto o kit.");
      return;
    }

    setIsSubmitting(true);

    const quoteRaw: any = {
      id: generateQuoteId(),
      customerName: customerInfo.name,
      customerEmail: customerInfo.email || undefined,
      customerPhone: customerInfo.phone || undefined,
      company: customerInfo.company || undefined,
      eventDate: customerInfo.eventDate || undefined,
      eventType: customerInfo.eventType || undefined,
      items: quoteItems,
      totalEstimate: calculateQuoteTotal(quoteItems),
      specialRequests: specialRequests || undefined,
      urgency,
      status: "pending",
    };

    const cleaned = removeUndefined(quoteRaw);
    cleaned.createdAt = serverTimestamp();
    cleaned.updatedAt = serverTimestamp();

    try {
      if (typeof createQuoteInLib === "function") {
        try {
          await createQuoteInLib(cleaned as any);
        } catch (err) {
          console.warn("createQuoteInLib failed, falling back to addDoc:", err);
          await addDoc(collection(db, "quotes"), cleaned);
        }
      } else {
        await addDoc(collection(db, "quotes"), cleaned);
      }
    } catch (err) {
      console.error("Error creating quote:", err);
      alert("Ocurrió un error enviando la cotización. Intenta nuevamente.");
      setIsSubmitting(false);
      return;
    }

    // --- construimos el mensaje de WhatsApp (solo destinatario ADMIN) ---
    const itemsText = quoteItems
      .map((it, idx) => `${idx + 1}. ${it.productName || it.productId} x${it.quantity} - ${formatPrice(it.basePrice ?? 0)} each`)
      .join("\n");
    const waMessage = `Hola, solicito una cotización:\n\nNombre: ${cleaned.customerName}\nTel: ${cleaned.customerPhone || "-"}\nEmail: ${cleaned.customerEmail || "-"}\n\nItems:\n${itemsText}\n\nTotal estimado: ${formatPrice(cleaned.totalEstimate || 0)}\nUrgencia: ${cleaned.urgency}\nDetalles: ${cleaned.specialRequests || "-"}`;

    // ------------- Aquí aseguramos que el número admin sea usado (y saneado) -------------
    // Preferimos NEXT_PUBLIC_ADMIN_WHATSAPP, luego NEXT_PUBLIC_ADMIN_PHONE. Importante: ambas son variables públicas
    // que deben estar definidas en build (NEXT_PUBLIC_...). Si no hay número admin, NO abrimos wa.me (evitamos abrir al propio cliente).
    const rawAdmin =
      (process.env.NEXT_PUBLIC_ADMIN_WHATSAPP && String(process.env.NEXT_PUBLIC_ADMIN_WHATSAPP)) ||
      (process.env.NEXT_PUBLIC_ADMIN_PHONE && String(process.env.NEXT_PUBLIC_ADMIN_PHONE)) ||
      "";

    const sanitizedAdmin = rawAdmin.replace(/\+/g, "").replace(/\D/g, ""); // solo dígitos
    if (sanitizedAdmin && sanitizedAdmin.length >= 7) {
      try {
        const waLink = `https://wa.me/${sanitizedAdmin}?text=${encodeURIComponent(waMessage)}`;
        window.open(waLink, "_blank");
      } catch (err) {
        console.warn("Could not open WhatsApp link", err);
      }
    } else {
      // No hay número admin configurado: evitamos abrir chat (evita enviar a ti mismo).
      // Copiamos el mensaje al portapapeles y avisamos.
      try {
        await navigator.clipboard.writeText(waMessage);
        alert(
          "Número de WhatsApp del admin no configurado. Hemos guardado el mensaje en el portapapeles para que puedas compartirlo manualmente."
        );
      } catch (err) {
        alert(
          "Número de WhatsApp del admin no configurado y no se pudo copiar al portapapeles. Contacta al administrador o revisa la configuración."
        );
      }
    }
    // --------------------------------------------------------------------------------------

    setTimeout(() => {
      setIsSubmitting(false);
      alert("¡Cotización enviada exitosamente! Te contactaremos pronto.");
      setCustomerInfo({ name: "", email: "", phone: "", company: "", eventDate: "", eventType: "" });
      setQuoteItems([]);
      setSpecialRequests("");
      setUrgency("normal");
      try {
        router.push("/cotizacion");
      } catch (err) {
        // ignore
      }
    }, 500);
  }
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-lg font-bold text-red-600">Eternal Love</span>
            </div>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Solicitar Cotización</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cuéntanos sobre tu proyecto y te enviaremos una cotización personalizada con los mejores precios.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Customer Information */}
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <Package className="w-5 h-5 mr-2" />
                Información de Contacto
              </CardTitle>
              <CardDescription>Necesitamos estos datos para enviarte la cotización y coordinar la entrega.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input id="name" value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} placeholder="Tu nombre completo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input id="email" type="email" value={customerInfo.email} onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })} placeholder="tu@email.com" required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input id="phone" value={customerInfo.phone} onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} placeholder="+57 300 123 4567" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa (Opcional)</Label>
                  <Input id="company" value={customerInfo.company} onChange={(e) => setCustomerInfo({ ...customerInfo, company: e.target.value })} placeholder="Nombre de tu empresa" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate" className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Fecha del Evento (Opcional)
                  </Label>
                  <Input id="eventDate" type="date" value={customerInfo.eventDate} onChange={(e) => setCustomerInfo({ ...customerInfo, eventDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">Tipo de Evento (Opcional)</Label>
                  <Input id="eventType" value={customerInfo.eventType} onChange={(e) => setCustomerInfo({ ...customerInfo, eventType: e.target.value })} placeholder="Cumpleaños, boda, empresa, etc." />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products/Kits Selection */}
          <Card className="border-purple-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-purple-600">
                    <Calculator className="w-5 h-5 mr-2" />
                    Productos a Cotizar (Productos y Kits)
                  </CardTitle>
                  <CardDescription>Agrega productos o kits especiales que necesites.</CardDescription>
                </div>
                <Button type="button" onClick={addQuoteItem} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto / Kit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {quoteItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay productos agregados. Haz clic en "Agregar Producto / Kit" para comenzar.</p>
                </div>
              ) : (
                quoteItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800">Item #{index + 1}</h4>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeQuoteItem(index)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Producto / Kit *</Label>
                        <SearchableItemSelect
                          products={loadingProducts ? mockProducts : products}
                          kits={loadingKits ? [] : kits}
                          value={item.productId}
                          onSelect={(sel) => {
                            if (!sel) {
                              updateQuoteItem(index, "productId", "" as any);
                              return;
                            }
                            const idToStore = sel.type === "kit" ? `kit:${sel.id}` : sel.id;
                            updateQuoteItem(index, "productId", idToStore as any);
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cantidad *</Label>
                        <select
                          className="w-full border border-gray-200 rounded-md px-3 py-2"
                          value={item.quantity.toString()}
                          onChange={(e) => updateQuoteItem(index, "quantity", Number.parseInt(e.target.value) as any)}
                        >
                          {[1, 2, 3, 4, 5, 10, 15, 20, 25, 50, 100].map((num) => (
                            <option key={num} value={num.toString()}>
                              {num} {num === 1 ? "unidad" : "unidades"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {item.productId && !item.productId.startsWith("kit:") && (
                      <>
                        <div className="grid md:grid-cols-3 gap-4">
                          {getProductByIdLocal(item.productId as string)?.sizes && (
                            <div className="space-y-2">
                              <Label>Talla</Label>
                              <select className="w-full border border-gray-200 rounded-md px-3 py-2" value={item.selectedSize || ""} onChange={(e) => updateQuoteItem(index, "selectedSize", e.target.value as any)}>
                                <option value="">Seleccionar</option>
                                {((getProductByIdLocal(item.productId as string) as Product).sizes || []).map((size) => (
                                  <option key={size} value={size}>
                                    {size}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {getProductByIdLocal(item.productId as string)?.colors && (
                            <div className="space-y-2">
                              <Label>Color</Label>
                              <select className="w-full border border-gray-200 rounded-md px-3 py-2" value={item.selectedColor || ""} onChange={(e) => updateQuoteItem(index, "selectedColor", e.target.value as any)}>
                                <option value="">Seleccionar</option>
                                {((getProductByIdLocal(item.productId as string) as Product).colors || []).map((color) => (
                                  <option key={color} value={color}>
                                    {color}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {getProductByIdLocal(item.productId as string)?.materials && (
                            <div className="space-y-2">
                              <Label>Material</Label>
                              <select className="w-full border border-gray-200 rounded-md px-3 py-2" value={item.selectedMaterial || ""} onChange={(e) => updateQuoteItem(index, "selectedMaterial", e.target.value as any)}>
                                <option value="">Seleccionar</option>
                                {((getProductByIdLocal(item.productId as string) as Product).materials || []).map((material) => (
                                  <option key={material} value={material}>
                                    {material}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>Personalización</Label>
                      <Textarea placeholder="Describe tu diseño personalizado, mensaje especial, colores específicos, etc." value={item.customMessage || ""} onChange={(e) => updateQuoteItem(index, "customMessage", e.target.value as any)} rows={2} />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-gray-600">{formatPrice(item.basePrice)} × {item.quantity}</span>
                      <span className="font-semibold text-lg text-red-600">{formatPrice(item.totalPrice)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="border-sky-100">
            <CardHeader>
              <CardTitle className="flex items-center text-sky-600">
                <Clock className="w-5 h-5 mr-2" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Urgencia del Pedido</Label>
                <select className="w-full border border-gray-200 rounded-md px-3 py-2" value={urgency} onChange={(e) => setUrgency(e.target.value as any)}>
                  <option value="normal">Normal (7-10 días)</option>
                  <option value="urgent">Urgente (3-5 días) - Costo adicional</option>
                  <option value="express">Express (1-2 días) - Costo adicional</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Solicitudes Especiales</Label>
                <Textarea placeholder="Cualquier detalle adicional, instrucciones especiales, referencias de diseño, etc." value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Summary and Submit */}
          <Card className="border-amber-100 bg-amber-50/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Resumen de Cotización</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Estimado Total</p>
                  <p className="text-2xl font-bold text-red-600">{formatPrice(totalEstimate)}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span>Items ({quoteItems.length})</span>
                  <span>{formatPrice(totalEstimate)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Personalización</span>
                  <span>Incluida</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Envío</span>
                  <span>Por calcular</span>
                </div>
                {urgency !== "normal" && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Urgencia ({urgency})</span>
                    <span>Por calcular</span>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-lg py-6" disabled={isSubmitting || quoteItems.length === 0 || !customerInfo.name || !customerInfo.email || !customerInfo.phone}>
                {isSubmitting ? "Enviando Cotización..." : (<><Send className="w-5 h-5 mr-2" /> Enviar Solicitud de Cotización</>)}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">* Los precios son estimados. La cotización final puede variar según las especificaciones exactas.</p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
