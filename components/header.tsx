// components/header.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Heart, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context"; // <-- usamos el hook

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth(); // user?.role puede ser "admin" o "user" o null

  const navigation = [
    { name: "Inicio", href: "/" },
    { name: "Catálogo", href: "/catalogo" },
    { name: "Cotización", href: "/cotizacion" },
    { name: "Calendario", href: "/calendario" },
    { name: "Contacto", href: "/contacto" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-pink-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative w-12 h-12">
              <Image src="/logo.png" alt="Eternal Love Logo" fill className="object-contain" priority />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                Eternal Love
              </h1>
              <p className="text-xs text-gray-600">Personalización con Amor</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Button
                key={item.name}
                asChild
                variant="ghost"
                className="text-gray-700 hover:text-pink-600 hover:bg-pink-50"
              >
                <Link href={item.href}>{item.name}</Link>
              </Button>
            ))}

            {/* Si es admin, mostramos Admin en la navegación */}
            {user?.role === "admin" && (
              <Button asChild variant="ghost" className="text-gray-700 hover:text-pink-600 hover:bg-pink-50">
                <Link href="/admin">Admin</Link>
              </Button>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-pink-200 text-pink-600 hover:bg-pink-50 bg-transparent"
            >
              <Link href="/login">
                <User className="w-4 h-4 mr-1" />
                Ingresar
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            >
              <Link href="/cotizacion">
                <Heart className="w-4 h-4 mr-1" />
                Cotizar
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-pink-100 py-4">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Button
                  key={item.name}
                  asChild
                  variant="ghost"
                  className="justify-start text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href={item.href}>{item.name}</Link>
                </Button>
              ))}

              {/* admin en mobile */}
              {user?.role === "admin" && (
                <Button
                  asChild
                  variant="ghost"
                  className="justify-start text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href="/admin">Admin</Link>
                </Button>
              )}

              <div className="flex flex-col space-y-2 pt-4 border-t border-pink-100">
                <Button
                  asChild
                  variant="outline"
                  className="border-pink-200 text-pink-600 hover:bg-pink-50 bg-transparent"
                >
                  <Link href="/login">
                    <User className="w-4 h-4 mr-2" />
                    Ingresar
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                >
                  <Link href="/cotizacion">
                    <Heart className="w-4 h-4 mr-2" />
                    Cotizar Ahora
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
