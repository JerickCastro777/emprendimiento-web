// app/admin/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // ajusta si tu export es distinto

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Si no está autenticado → ir a login
        router.push("/login");
        return;
      }

      try {
        // Leer doc users/{uid} para comprobar role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? userDoc.data()?.role : null;

        if (role && String(role).toLowerCase() === "admin") {
          setAllowed(true);
        } else {
          // Si no es admin -> redirigir a inicio
          router.push("/");
        }
      } catch (err) {
        console.error("Error verificando rol admin:", err);
        router.push("/");
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Comprobando permisos…</div>
      </div>
    );
  }

  if (!allowed) return null;

  // Si aquí pasó, el usuario es admin: renderizamos el admin UI (children)
  return <>{children}</>;
}
