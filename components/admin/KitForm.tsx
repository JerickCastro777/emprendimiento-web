// components/admin/KitForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { fetchAllProducts } from "@/lib/products";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import ProductSelector from "@/components/admin/ProductSelector";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export default function KitForm() {
  const router = useRouter();

  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null); // preview URL
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [kitPrice, setKitPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [featured, setFeatured] = useState(false);

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [userLogged, setUserLogged] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await fetchAllProducts();
        if (!mounted) return;
        setProducts(all.map((p) => ({ id: p.id, name: p.name })));
      } catch (e) {
        console.error("[KitForm] error cargando productos:", e);
      }
    })();

    const unsub = onAuthStateChanged(auth, (u) => {
      setUserLogged(u);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  function toggleProduct(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function handleFileInput(file?: File) {
    if (!file) {
      setFileToUpload(null);
      setImagePreview(null);
      return;
    }
    const MAX_BYTES = 1_500_000; // 1.5MB
    if (file.size > MAX_BYTES) {
      alert("El archivo es muy grande. Usa una imagen más pequeña (max 1.5MB) o pega la URL.");
      return;
    }
    setFileToUpload(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setImageUrlInput("");
  }

  function handleImageUrlApply() {
    if (!imageUrlInput.trim()) {
      alert("Pega una URL válida o selecciona un archivo.");
      return;
    }
    setFileToUpload(null);
    setImagePreview(imageUrlInput.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      alert("El kit necesita un nombre.");
      return;
    }
    if (selected.length === 0) {
      alert("Selecciona al menos un producto para el kit.");
      return;
    }

    if (!userLogged) {
      alert("Debes iniciar sesión como administrador para crear un kit.");
      console.warn("[KitForm] usuario no autenticado intentando crear kit");
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl: string | null = null;

      if (fileToUpload) {
        // subir a Cloudinary
        try {
          finalImageUrl = await uploadImageToCloudinary(
            fileToUpload,
            process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
            process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
          );
        } catch (err) {
          console.error("[KitForm] error subiendo a Cloudinary:", err);
          alert("No se pudo subir la imagen. Intenta otra o pega la URL.");
          setLoading(false);
          return;
        }
      } else if (imageUrlInput && imageUrlInput.trim()) {
        finalImageUrl = imageUrlInput.trim();
      } else if (imagePreview && imagePreview.startsWith("http")) {
        finalImageUrl = imagePreview;
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || "",
        image: finalImageUrl || null,
        productIds: selected,
        kitPrice: Number(kitPrice) || 0,
        originalPrice: Number(originalPrice) || 0,
        discount:
          (Number(originalPrice || 0) > 0 && Number(kitPrice || 0) > 0)
            ? Math.round(((Number(originalPrice) - Number(kitPrice)) / Number(originalPrice)) * 100)
            : undefined,
        featured: !!featured,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userLogged?.uid ?? null,
      };

      console.log("[KitForm] payload antes de crear:", payload, "user:", userLogged?.uid);

      const ref = await addDoc(collection(db, "kits"), payload);
      console.log("[KitForm] kit creado id:", ref.id);
      alert("Kit creado correctamente.");

      setName("");
      setDescription("");
      setImagePreview(null);
      setImageUrlInput("");
      setFileToUpload(null);
      setSelected([]);
      setKitPrice("");
      setOriginalPrice("");
      setFeatured(false);

      try {
        router.push("/admin/kits");
      } catch (err) {}
    } catch (err: any) {
      console.error("[KitForm] error creando kit:", err);
      alert("Error al crear kit. Revisa la consola para más detalles.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Crear Nuevo Kit</h3>

      {!userLogged && <div className="mb-4 text-sm text-red-600">No estás autenticado. Inicia sesión como admin para crear kits.</div>}

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

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileInput(e.target.files ? e.target.files[0] : undefined)}
            className="block"
          />
          <div className="flex-1">
            <input
              placeholder="O pega una URL de imagen"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={handleImageUrlApply} className="px-3 py-1 bg-gray-100 rounded">
                Usar URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageUrlInput("");
                  setFileToUpload(null);
                }}
                className="px-3 py-1 border rounded"
              >
                Quitar imagen
              </button>
            </div>
          </div>
        </div>

        {imagePreview && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Previsualización:</div>
            <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded border" />
          </div>
        )}
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
        <ProductSelector value={selected} onChange={(ids) => setSelected(ids)} productsProp={undefined} pageSize={9} />
      </div>

      <label className="flex items-center gap-2 mb-4">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        <span className="text-sm">Destacado</span>
      </label>

      <div className="flex gap-3">
        <button type="submit" disabled={loading || !userLogged} className="px-4 py-2 bg-pink-500 text-white rounded">
          {loading ? "Creando..." : "Crear Kit"}
        </button>
        <button
          type="button"
          onClick={() => {
            setName("");
            setDescription("");
            setImagePreview(null);
            setImageUrlInput("");
            setFileToUpload(null);
            setSelected([]);
            setKitPrice("");
            setOriginalPrice("");
            setFeatured(false);
          }}
          className="px-4 py-2 border rounded"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}
