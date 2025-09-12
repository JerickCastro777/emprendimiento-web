// lib/admin.ts
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export type NewProductPayload = {
  name: string;
  description?: string;
  basePrice?: number;
  images?: string[];
  tags?: string[];
  sku?: string;
  stock?: number;
  category?: string;
  customizable?: boolean;
};

export async function createProduct(payload: NewProductPayload) {
  const col = collection(db, "products");
  const now = serverTimestamp();
  const docRef = await addDoc(col, {
    ...payload,
    basePrice: payload.basePrice ?? 0,
    stock: payload.stock ?? 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateProduct(id: string, updates: Partial<NewProductPayload & { updatedAt?: any }>) {
  const d = doc(db, "products", id);
  await setDoc(d, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteProduct(id: string) {
  const d = doc(db, "products", id);
  await deleteDoc(d);
}
