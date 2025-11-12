// components/admin/KitEditForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { getKitById } from "@/lib/products";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import ProductSelector from "@/components/admin/ProductSelector";
import { useRouter } from "next/navigation";

type Props = {
  kitId: string;
};

export default function KitEditForm({ kitId }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [kit, setKit] = useState<any | null>(null);

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [kitPrice, setKitPrice] = useState<string>("");
  const [originalPrice, setOriginalPrice] = useState<string>("");
  const [selected, setSelected] = useState<string[]>([]);
  const [featured, setFeatured] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const k = await getKitById(kitId);
        if (!mounted) return;
        if (!k) {
          setKit(null);
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
      } catch (err) {
        console.error("Error cargando kit:", err);
        setKit(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [kitId]);

  // Limpieza del object URL si se puso una preview local
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(imagePreview);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [imagePreview]);

  if (loading) return <div className="p-4">Cargando kit...</div>;
  if (!kit) return <div className="p-4 text-red-600">Kit no encontrado</div>;

  function handleFileInput(file?: File) {
    if (!file) {
      // si quitan la selección, dejamos la preview original (si existe)
      setFileToUpload(null);
      setImagePreview(kit.image ?? null);
      return;
    }
    const MAX_BYTES = 1_500_000; // 1.5MB
    if (file.size > MAX_BYTES) {
      alert("El archivo es muy grande. Usa una imagen más pequeña (max 1.5MB) o pega la URL.");
      return;
    }
    // revoke preview anterior si era blob
    if (imagePreview && imagePreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch (e) {
        /* noop */
      }
    }
    setFileToUpload(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      let finalImageUrl = kit.image ?? null;

      if (fileToUpload) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
        if (!cloudName || !uploadPreset) {
          throw new Error("Faltan variables de entorno para Cloudinary (NEXT_PUBLIC_CLOUDINARY_*).");
        }
        finalImageUrl = await uploadImageToCloudinary(fileToUpload, cloudName, uploadPreset);
      }

      // parse numbers de forma segura
      const parseNumber = (v: string) => {
        const cleaned = String(v).replace(/[^\d.-]/g, "");
        const n = parseFloat(cleaned);
        return Number.isFinite(n) ? n : 0;
      };

      const nKitPrice = parseNumber(kitPrice);
      const nOriginalPrice = parseNumber(originalPrice);

      const payload: any = {
        name: name.trim(),
        description: description.trim() || "",
        image: finalImageUrl,
        productIds: selected,
        kitPrice: nKitPrice,
        originalPrice: nOriginalPrice,
        discount:
          nOriginalPrice > 0 && nKitPrice > 0
            ? Math.round(((nOriginalPrice - nKitPrice) / nOriginalPrice) * 100)
            : undefined,
        featured: !!featured,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "kits", kitId), payload);

      // feedback y redirección
      alert("Kit actualizado correctamente.");
      router.push("/admin/kits");
    } catch (err: any) {
      console.error("Error actualizando kit:", err);
      alert(err?.message ? `Error: ${err.message}` : "Error actualizando kit (ver consola).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md"
      aria-labelledby="kit-edit-form"
    >
      <h3 id="kit-edit-form" className="text-xl font-semibold mb-4">
        Editar Kit
      </h3>

      <label className="block mb-3">
        <div className="text-sm mb-1">Nombre</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </label>

      <label className="block mb-3">
        <div className="text-sm mb-1">Descripción</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={4}
        />
      </label>

      <div className="mb-4">
        <div className="text-sm mb-2">Imagen global del kit (se mostrará arriba)</div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileInput(e.target.files ? e.target.files[0] : undefined)}
        />
        <div className="mt-3">
          {imagePreview ? (
            <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded" />
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <label>
          <div className="text-sm mb-1">Precio del kit</div>
          <input
            value={kitPrice}
            onChange={(e) => setKitPrice(e.target.value)}
            className="w-full border rounded px-3 py-2"
            inputMode="numeric"
            placeholder="0"
            required
          />
        </label>
        <label>
          <div className="text-sm mb-1">Precio original (suma)</div>
          <input
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            className="w-full border rounded px-3 py-2"
            inputMode="numeric"
            placeholder="0"
          />
        </label>
      </div>

      <div className="mb-4">
        <div className="text-sm mb-2">Selecciona productos del catálogo</div>
        <ProductSelector value={selected} onChange={setSelected} pageSize={9} />
      </div>

      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
        />
        <span className="text-sm">Destacado</span>
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${loading ? "bg-gray-400" : "bg-purple-600"}`}
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/kits")}
          className="px-4 py-2 rounded border"
          disabled={loading}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
