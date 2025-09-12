// lib/quotes.ts
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
  deleteDoc,
} from "firebase/firestore";

export type QuoteItem = {
  productId: string;
  name: string;
  qty: number;
  basePrice: number;
  total: number;
};

export type Quote = {
  id?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: QuoteItem[];
  totalEstimate: number;
  message?: string;
  status?: "pending" | "processing" | "quoted" | "approved" | "rejected";
  response?: string;
  createdAt?: any;
  updatedAt?: any;
};

/**
 * createQuote
 * Guarda una cotización en Firestore (collection "quotes").
 */
export async function createQuote(payload: Omit<Quote, "id" | "createdAt" | "updatedAt">) {
  try {
    const docRef = await addDoc(collection(db, "quotes"), {
      ...payload,
      status: payload.status ?? "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ok: true, id: docRef.id };
  } catch (err) {
    console.error("createQuote error:", err);
    return { ok: false, error: (err as any)?.message || String(err) };
  }
}

/**
 * fetchQuotes
 * Recupera todas las cotizaciones (ordenadas por fecha desc).
 */
export async function fetchQuotes(): Promise<Quote[]> {
  try {
    const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const res: Quote[] = [];
    snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
      const data = d.data() as any;
      res.push({
        id: d.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        items: data.items ?? [],
        totalEstimate: data.totalEstimate ?? 0,
        message: data.message,
        status: data.status ?? "pending",
        response: data.response,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      });
    });
    return res;
  } catch (err) {
    console.error("fetchQuotes error:", err);
    return [];
  }
}

/**
 * updateQuoteStatus
 * Cambia el estado de una cotización
 */
export async function updateQuoteStatus(quoteId: string, status: Quote["status"]) {
  try {
    const ref = doc(db, "quotes", quoteId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
    return { ok: true };
  } catch (err) {
    console.error("updateQuoteStatus error:", err);
    return { ok: false, error: (err as any)?.message || String(err) };
  }
}

/**
 * addQuoteResponse
 * Agrega una respuesta (texto) a la cotización (por ejemplo el admin deja la cotización cotizada).
 */
export async function addQuoteResponse(quoteId: string, response: string, optionalStatus?: Quote["status"]) {
  try {
    const ref = doc(db, "quotes", quoteId);
    const payload: any = { response, updatedAt: serverTimestamp() };
    if (optionalStatus) payload.status = optionalStatus;
    await updateDoc(ref, payload);
    return { ok: true };
  } catch (err) {
    console.error("addQuoteResponse error:", err);
    return { ok: false, error: (err as any)?.message || String(err) };
  }
}
export async function deleteQuote(id: string): Promise<{ ok: boolean; error?: any }> {
  try {
    if (!id) return { ok: false, error: "missing id" };
    await deleteDoc(doc(db, "quotes", id));
    return { ok: true };
  } catch (error) {
    console.error("deleteQuote error:", error);
    return { ok: false, error };
  }
}