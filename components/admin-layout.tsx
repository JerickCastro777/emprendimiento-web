// app/admin/admin-layout.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, PlusCircle, Box, Package, FileText, Users, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type Props = { children: React.ReactNode };

export default function AdminLayout({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  const { user, loading, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/admin" && pathname === "/admin") return true;
    return pathname.startsWith(path);
  };

  async function handleLogout() {
    try {
      await logout();
      router.replace("/"); // <-- redirige al inicio
    } catch (err) {
      console.error("Logout error:", err);
      alert("Ocurrió un error al cerrar sesión. Revisa la consola.");
    }
  }

  const isAdmin = !loading && user?.role === "admin";

  return (
    <div className="admin-root min-h-screen bg-gray-50">
      {/* Header: mantengo la misma estructura — solo cambio tamaño logo y color del texto */}
      <header className="admin-topbar sticky top-0 z-40 flex items-center justify-between px-4 py-3 shadow-md bg-white">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-3">
            {/* Logo: agrandado ligeramente */}
            <div className="relative w-14 h-14">
              <Image src="/logo.png" alt="Eternal Love" fill className="object-contain" priority />
            </div>

            {/* Textos del header en blanco para buen contraste (los pediste en blanco) */}
            <div className="hidden md:block">
              <h1 className="text-lg font-extrabold text-white leading-tight">Eternal Love</h1>
              <p className="text-xs text-white/90">Panel de administración</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/productos/new" className="inline-flex items-center gap-2 px-3 py-1.5 bg-pink-500 text-white rounded-md hover:opacity-95">
            <PlusCircle className="w-4 h-4" />
            <span className="text-sm">Nuevo</span>
          </Link>

          <Link href="/" className="px-3 py-1.5 rounded-md border text-sm bg-white hover:bg-gray-50">
            Ver sitio
          </Link>
        </div>
      </header>

      <div className="admin-container flex">
        {/* Sidebar */}
        <aside className={`admin-sidebar ${collapsed ? "w-16" : "w-64"} transition-width duration-150 bg-white border-r min-h-[calc(100vh-64px)]`}>
          <div className="px-4 py-4 flex-1">
            <div className="text-xs text-gray-400 uppercase font-semibold px-2 mb-3">Gestión</div>

           <nav className="space-y-2">
  {isAdmin ? (
    <>
      <Link
        href="/admin/productos"
        className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 ${
          isActive("/admin/productos") ? "bg-white/10 text-white" : ""
        }`}
      >
        <Package className={`w-5 h-5 ${isActive("/admin/productos") ? "text-white" : "text-pink-500"}`} />
        <span className="nav-text">Productos</span>
      </Link>

      <Link
        href="/admin/productos/new"
        className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 ${
          isActive("/admin/productos/new") ? "bg-white/10 text-white" : ""
        }`}
      >
        <PlusCircle className={`w-5 h-5 ${isActive("/admin/productos/new") ? "text-white" : "text-pink-500"}`} />
        <span className="nav-text">Agregar</span>
      </Link>

      <Link
        href="/admin/kits"
        className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 ${
          isActive("/admin/kits") ? "bg-white/10 text-white" : ""
        }`}
      >
        <Box className={`w-5 h-5 ${isActive("/admin/kits") ? "text-white" : "text-yellow-500"}`} />
        <span className="nav-text">Kits</span>
      </Link>

      <Link
        href="/admin/cotizaciones"
        className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 ${
          isActive("/admin/cotizaciones") ? "bg-white/10 text-white" : ""
        }`}
      >
        <FileText className={`w-5 h-5 ${isActive("/admin/cotizaciones") ? "text-white" : "text-indigo-500"}`} />
        <span className="nav-text">Cotizaciones</span>
      </Link>

      <Link
        href="/admin/usuarios"
        className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 ${
          isActive("/admin/usuarios") ? "bg-white/10 text-white" : ""
        }`}
      >
        <Users className={`w-5 h-5 ${isActive("/admin/usuarios") ? "text-white" : "text-green-500"}`} />
        <span className="nav-text">Usuarios</span>
      </Link>
    </>
  ) : (
    <div className="px-2 py-3 text-sm text-gray-500">Acceso admin protegido</div>
  )}
</nav>

          </div>

          {/* Footer del sidebar */}
        </aside>

        {/* Main content */}
        <main className="admin-main flex-1 min-h-screen p-6 bg-gray-50">
          <div className="admin-main-inner max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Panel de administración</h2>
                <p className="text-sm text-gray-500">Añade, edita y controla stock.</p>
              </div>
            </div>

            <div className="space-y-6">{children}</div>
          </div>
        </main>
      </div>

      {/* ---- BOTÓN FIJO: Cerrar sesión (parte izquierda-baja) ---- */}
     {!loading && user ? (
  <button
    onClick={handleLogout}
    title="Cerrar sesión"
    className="fixed left-4 bottom-16 z-[99999] flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-2xl hover:scale-105 transition-transform"
  >
    <LogOut className="w-4 h-4 text-white" />
    <span className="hidden sm:inline text-sm">Cerrar sesión</span>
  </button>
) : null}

    </div>
  );
}
