// lib/products.ts
// Utilities para productos y kits (Firestore + fallback mock)

import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  setDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export type Product = {
  id: string;
  name: string;
  category?: string;
  basePrice?: number;
  description?: string;
  images?: string[];
  tags?: string[];
  sku?: string;
  stock?: number;
  customizable?: boolean;
  createdAt?: any;
  updatedAt?: any;
  featured?: boolean;
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  [key: string]: any;
};

export type Kit = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  productIds: string[];
  kitPrice?: number;
  originalPrice?: number;
  discount?: number;
  featured?: boolean;
  createdAt?: any;
  products?: Product[];
  [key: string]: any;
};

/* ---------- Helpers ---------- */

/**
 * Normalize tags coming from different formats:
 * - array -> keep strings
 * - string "a,b, c" -> ['#a', '#b']
 * - string already with # -> keeps #prefix
 */
function normalizeTags(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((t) => String(t || "").trim()).filter(Boolean);
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.startsWith("#") ? s : `#${s.replace(/\s+/g, "-").toLowerCase()}`));
  }
  return [];
}

/* ---------- Formatting helpers ---------- */
export function formatPrice(value?: number) {
  if ((value === undefined || value === null) && value !== 0) return "$0";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
    value ?? 0
  );
}

/* ---------- Mock fallback ---------- */
export const mockProducts: Product[] = [
  {
    id: "camiseta-personalizada-premium",
    name: "Camiseta Personalizada Premium",
    category: "camisetas",
    basePrice: 35000,
    description: "Camiseta de alta calidad 100% algodón con personalización completa",
    images: ["/premium-custom-t-shirt.png"],
    tags: ["#general"],
    sku: "CAM-PREM-001",
  },
  {
    id: "pocillo-magico-cambio-color",
    name: "Pocillo Mágico Cambio de Color",
    category: "pocillos",
    basePrice: 28000,
    description: "Pocillo que cambia de color con líquidos calientes",
    images: ["/magic-color-changing-mug.png"],
    tags: ["#general"],
    sku: "POC-MAG-001",
  },
];

export const mockKits: Kit[] = [
  {
    id: "kit-romantico-inicial",
    name: "Kit Romántico",
    description: "Camiseta premium + pocillo mágico. Perfecto para regalar con amor.",
    image: "/kit-romantico.png",
    productIds: ["camiseta-personalizada-premium", "pocillo-magico-cambio-color"],
    kitPrice: 58000,
    originalPrice: 63000,
    discount: 8,
    featured: true,
  },
];

/* ---------- Firestore helpers ---------- */

export async function fetchAllProducts(): Promise<Product[]> {
  try {
    console.log("[products] fetchAllProducts: iniciando getDocs(collection(db, 'products'))");
    const snap = await getDocs(collection(db, "products"));
    const res: Product[] = [];
    snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
      const data = d.data();
      const images = Array.isArray(data.images) ? data.images : data.image ? [data.image] : [];
      const basePrice = typeof data.basePrice === "number" ? data.basePrice : typeof data.price === "number" ? data.price : 0;

      res.push({
        id: d.id,
        name: data.name || data.title || "",
        category: data.category,
        basePrice,
        description: data.description ?? "",
        images,
        tags: normalizeTags(data.tags),
        sku: data.sku ?? "",
        stock: data.stock ?? 0,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
        ...data,
      });
    });

    if (res.length === 0) return mockProducts;
    return res;
  } catch (e) {
    console.error("fetchAllProducts error:", e);
    return mockProducts;
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    if (!id) return null;
    const pSnap: DocumentSnapshot<DocumentData> = await getDoc(doc(db, "products", id));
    if (!pSnap.exists()) return null;
    const data = pSnap.data()!;
    const images = Array.isArray(data.images) ? data.images : data.image ? [data.image] : [];
    const basePrice = typeof data.basePrice === "number" ? data.basePrice : typeof data.price === "number" ? data.price : 0;

    const product: Product = {
      id: pSnap.id,
      name: data.name ?? data.title ?? "",
      category: data.category,
      basePrice,
      description: data.description ?? "",
      images,
      tags: normalizeTags(data.tags),
      sku: data.sku ?? "",
      stock: data.stock ?? 0,
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
      ...data,
    };
    return product;
  } catch (e) {
    console.error("fetchProductById error:", e);
    return null;
  }
}

export function getProductByIdSyncMock(id: string): Product | null {
  const found = mockProducts.find((p) => p.id === id);
  return found ?? null;
}

export async function searchProducts(
  term?: string,
  category?: string | null,
  priceRange?: { min?: number; max?: number } | null,
  holidayTag?: string | null
): Promise<Product[]> {
  try {
    const all = await fetchAllProducts();
    let filtered = all;

    if (holidayTag) {
      const normalized = holidayTag.startsWith("#") ? holidayTag.toLowerCase() : `#${holidayTag.toLowerCase()}`;
      filtered = filtered.filter((p) => Array.isArray(p.tags) && p.tags.map((t) => (t || "").toLowerCase()).includes(normalized));
    }

    if (category) {
      filtered = filtered.filter((p) => (p.category || "").toLowerCase() === (category || "").toLowerCase());
    }

    if (priceRange && (typeof priceRange.min !== "undefined" || typeof priceRange.max !== "undefined")) {
      const min = typeof priceRange.min === "number" ? priceRange.min : 0;
      const max = typeof priceRange.max === "number" ? priceRange.max : Number.POSITIVE_INFINITY;
      filtered = filtered.filter((p) => {
        const price = p.basePrice ?? 0;
        return price >= min && price <= max;
      });
    }

    if (term && term.trim().length > 0) {
      const q = term.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const inName = (p.name || "").toLowerCase().includes(q);
        const inSku = (p.sku || "").toLowerCase().includes(q);
        const inDesc = (p.description || "").toLowerCase().includes(q);
        const inTags =
          Array.isArray(p.tags) &&
          p.tags.some((t) => (t || "").toString().toLowerCase().includes(q));
        return inName || inSku || inDesc || inTags;
      });
    }

    return filtered;
  } catch (e) {
    console.error("searchProducts error:", e);
    return [];
  }
}

/* ---------- Kits ---------- */

export async function getKits(): Promise<Kit[]> {
  try {
    const snap = await getDocs(collection(db, "kits"));
    const kits: Kit[] = [];
    const docs: QueryDocumentSnapshot<DocumentData>[] = [];
    snap.forEach((d) => docs.push(d));

    if (docs.length === 0) {
      const kitsWithProducts = mockKits.map((kit) => ({
        ...kit,
        products: kit.productIds
          .map((pid) => mockProducts.find((p) => p.id === pid))
          .filter(Boolean) as Product[],
      }));
      return kitsWithProducts;
    }

    for (const d of docs) {
      const data = d.data();
      const kit: Kit = {
        id: d.id,
        name: data.name ?? data.title ?? "",
        description: data.description ?? "",
        image: data.image ?? "",
        productIds: data.productIds ?? [],
        kitPrice: data.kitPrice ?? data.price ?? 0,
        originalPrice: data.originalPrice ?? 0,
        discount: data.discount ?? 0,
        featured: data.featured ?? false,
        createdAt: data.createdAt ?? null,
      };

      kit.products = [];
      if (Array.isArray(kit.productIds) && kit.productIds.length > 0) {
        const productPromises = kit.productIds.map(async (pid) => {
          try {
            const pdSnap: DocumentSnapshot<DocumentData> = await getDoc(doc(db, "products", pid));
            if (pdSnap.exists()) {
              const pd = pdSnap.data()!;
              return {
                id: pdSnap.id,
                name: pd.name ?? pd.title ?? "",
                category: pd.category,
                basePrice: pd.basePrice ?? pd.price ?? 0,
                description: pd.description ?? pd.description ?? "",
                images: pd.images ?? (pd.image ? [pd.image] : []),
                tags: normalizeTags(pd.tags),
                sku: pd.sku ?? "",
                stock: pd.stock ?? 0,
                ...pd,
              } as Product;
            } else {
              return null;
            }
          } catch (err) {
            console.warn("Error resolving product", pid, err);
            return null;
          }
        });

        const resolved = await Promise.all(productPromises);
        kit.products = resolved.filter(Boolean) as Product[];
      }

      kits.push(kit);
    }

    return kits;
  } catch (e) {
    console.error("getKits error:", e);
    return mockKits.map((kit) => ({
      ...kit,
      products: kit.productIds.map((pid) => mockProducts.find((p) => p.id === pid)).filter(Boolean) as Product[],
    }));
  }
}

export async function getKitById(kitId: string): Promise<Kit | null> {
  try {
    const kSnap = await getDoc(doc(db, "kits", kitId));
    if (!kSnap.exists()) return null;
    const data = kSnap.data();
    const kit: Kit = {
      id: kSnap.id,
      name: data.name,
      description: data.description,
      image: data.image,
      productIds: data.productIds ?? [],
      kitPrice: data.kitPrice ?? 0,
      originalPrice: data.originalPrice ?? 0,
      discount: data.discount ?? 0,
      featured: data.featured ?? false,
      createdAt: data.createdAt ?? null,
      products: [],
    };
    if (Array.isArray(kit.productIds) && kit.productIds.length > 0) {
      const resolved = await Promise.all(
        kit.productIds.map(async (pid) => {
          const pdSnap = await getDoc(doc(db, "products", pid));
          if (!pdSnap.exists()) return null;
          const pd = pdSnap.data()!;
          return {
            id: pdSnap.id,
            name: pd.name ?? pd.title ?? "",
            category: pd.category,
            basePrice: pd.basePrice ?? pd.price ?? 0,
            images: pd.images ?? (pd.image ? [pd.image] : []),
            tags: normalizeTags(pd.tags),
            sku: pd.sku ?? "",
            stock: pd.stock ?? 0,
            ...pd,
          } as Product;
        })
      );
      kit.products = resolved.filter(Boolean) as Product[];
    }

    return kit;
  } catch (e) {
    console.error("getKitById error:", e);
    return null;
  }
}

/* ---------- Utility: calcular ahorro de un kit ---------- */
export function calculateKitSavings(kit: Kit) {
  try {
    const sum = (kit.products ?? []).reduce((acc, p) => acc + (p.basePrice ?? 0), 0);
    const original = kit.originalPrice ?? sum;
    const kitPrice = kit.kitPrice ?? original;
    return Math.max(0, original - kitPrice);
  } catch (e) {
    return 0;
  }
}
