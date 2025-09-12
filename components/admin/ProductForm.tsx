// components/admin/ProductForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/lib/products";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import FestivalSelect from "@/components/admin/FestivalSelect";

type Props = {
  product?: Product | null; // si viene, actúa como edit
  // permitimos que onSaved sea síncrono o async, y que reciba id o no
  onSaved?: (id?: string) => void | Promise<void>;
};

export default function ProductForm({ product, onSaved }: Props) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name ?? "");
  const [basePrice, setBasePrice] = useState(product?.basePrice ? String(product.basePrice) : "");
  const [stock, setStock] = useState(product?.stock ? String(product.stock) : "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [tags, setTags] = useState<string[]>(product?.tags ?? []);
  const [imageUrl, setImageUrl] = useState<string | "">((product?.images && product.images[0]) ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name ?? "");
      setBasePrice(product.basePrice ? String(product.basePrice) : "");
      setStock(product.stock ? String(product.stock) : "");
      setDescription(product.description ?? "");
      setTags(product.tags ?? []);
      setImageUrl((product.images && product.images[0]) ?? "");
    }
  }, [product]);

  async function uploadToCloudinary(file: File) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      throw new Error("Cloudinary env vars not configured.");
    }
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);
    const res = await fetch(url, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();
    return data.secure_url as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert("Indica un nombre para el producto.");
      return;
    }
    setLoading(true);
    try {
      let finalImageUrl = imageUrl || "";

      if (file) {
        // sube a cloudinary si hay archivo
        try {
          finalImageUrl = await uploadToCloudinary(file);
        } catch (err) {
          console.warn("Upload fallo, no se pudo subir a Cloudinary:", err);
          // fallback: usamos imageUrl si existe
          finalImageUrl = imageUrl || "";
        }
      }

      const payload: any = {
        name: name.trim(),
        basePrice: Number(basePrice) || 0,
        stock: Number(stock) || 0,
        description: description || "",
        images: finalImageUrl ? [finalImageUrl] : [],
        tags: tags || [],
        updatedAt: serverTimestamp(),
      };

      if (isEdit && product?.id) {
        const ref = doc(db, "products", product.id);
        await updateDoc(ref, payload);
        await onSaved?.(product.id);
        alert("Producto actualizado.");
      } else {
        payload.createdAt = serverTimestamp();
        const ref = await addDoc(collection(db, "products"), payload);
        await onSaved?.(ref.id);
        alert("Producto creado.");
      }
    } catch (err) {
      console.error("Error guardando producto:", err);
      alert("Error al guardar producto. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">{isEdit ? "Editar producto" : "Nuevo producto"}</h3>

      <label className="block mb-3">
        <div className="text-sm mb-1">Nombre</div>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" />
      </label>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <label>
          <div className="text-sm mb-1">Precio base</div>
          <input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="w-full border rounded px-3 py-2" />
        </label>
        <label>
          <div className="text-sm mb-1">Stock</div>
          <input value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border rounded px-3 py-2" />
        </label>
      </div>

      <label className="block mb-3">
        <div className="text-sm mb-1">Descripción</div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" />
      </label>

      <label className="block mb-3">
        <div className="text-sm mb-1">Festividades / Etiquetas</div>
        {/* FestivalSelect debe gestionar un array de strings */}
        <FestivalSelect value={tags} onChange={setTags} allowCustom={true} />
      </label>

      <div className="mb-4">
        <div className="text-sm mb-1">Imagen principal (URL o subir archivo)</div>
        <div className="flex gap-2 items-center">
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://." className="flex-1 border rounded px-3 py-2" />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
        </div>
        {imageUrl && !file && (
          <div className="mt-2">
            <img src={imageUrl} alt="preview" className="w-48 h-48 object-cover rounded border" />
          </div>
        )}
        {file && (
          <div className="mt-2">
            <div className="text-xs text-gray-500">Archivo seleccionado: {file.name}</div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-pink-500 text-white rounded">
          {loading ? "Guardando..." : isEdit ? "Actualizar producto" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
