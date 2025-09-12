// components/admin/KitEditForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { getKitById, formatPrice } from "@/lib/products";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import ProductSelector from "@/components/admin/ProductSelector";
import { serverTimestamp } from "firebase/firestore";


type Props = {
  kitId: string;
};

export default function KitEditForm({ kitId }: Props) {
  const [loading, setLoading] = useState(true);
  const [kit, setKit] = useState<any>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [kitPrice, setKitPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const k = await getKitById(kitId);
      if (!mounted) return;
      if (!k) {
        setLoading(false);
        return;
      }
      setKit(k);
      setName(k.name || "");
      setDescription(k.description || "");
      setImagePreview(k.image || null);
      setKitPrice((k.kitPrice ?? "").toString());
      setOriginalPrice((k.originalPrice ?? "").toString());
      setSelected(k.productIds ?? []);
      setFeatured(!!k.featured);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [kitId]);

  if (loading) return <div>Cargando kit...</div>;
  if (!kit) return <div>Kit no encontrado</div>;

  function handleFileInput(file?: File) {
    if (!file) {
      setFileToUpload(null);
      setImagePreview(null);
      return;
    }
    const MAX_BYTES = 1_500_000;
    if (file.size > MAX_BYTES) {
      alert("El archivo es muy grande. Usa una imagen más pequeña (max 1.5MB) o pega la URL.");
      return;
    }
    setFileToUpload(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = kit.image ?? null;
      if (fileToUpload) {
        finalImageUrl = await uploadImageToCloudinary(
          fileToUpload,
          process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
        );
      }

      const payload: any = {
        name: name.trim(),
        description: description.trim() || "",
        image: finalImageUrl,
        productIds: selected,
        kitPrice: Number(kitPrice) || 0,
        originalPrice: Number(originalPrice) || 0,
        discount:
          (Number(originalPrice || 0) > 0 && Number(kitPrice || 0) > 0)
            ? Math.round(((Number(originalPrice) - Number(kitPrice)) / Number(originalPrice)) * 100)
            : undefined,
        featured: !!featured,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "kits", kitId), payload);
      alert("Kit actualizado");
    } catch (err) {
      console.error("Error actualizando kit", err);
      alert("Error actualizando kit (ver consola).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Editar Kit</h3>

      <label className="block mb-3">
        <div className="text-sm mb-1">Nombre</div>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" />
      </label>

      <label className="block mb-3">
        <div className="text-sm mb-1">Descripción</div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" />
      </label>

      <div className="mb-4">
        <div className="text-sm mb-2">Imagen global del kit (se mostrará arriba)</div>
        <input type="file" accept="image/*" onChange={(e) => handleFileInput(e.target.files ? e.target.files[0] : undefined)} />
        <div className="mt-3">{imagePreview && <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded" />}</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <label>
          <div className="text-sm mb-1">Precio del kit</div>
          <input value={kitPrice} onChange={(e) => setKitPrice(e.target.value)} className="w-full border rounded px-3 py-2" />
        </label>
        <label>
          <div className="text-sm mb-1">Precio original (suma)</div>
          <input value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="w-full border rounded px-3 py-2" />
        </label>
      </div>

      <div className="mb-4">
        <div className="text-sm mb-2">Selecciona productos del catálogo</div>
        <ProductSelector value={selected} onChange={setSelected} pageSize={9} />
      </div>

      <label className="flex items-center gap-2 mb-4">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        <span className="text-sm">Destacado</span>
      </label>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded">
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
