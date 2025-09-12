// app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Calendar, MessageCircle, Package, Sparkles } from "lucide-react";
import Image from "next/image";
import { Header } from "@/components/header";
import HeroCarousel from "@/components/HeroCarousel";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50">
      {/* Header (tu componente) */}
      <Header />

      {/* HERO: Carousel (usa las imágenes en public/) */}
      <HeroCarousel />

      {/* Features: grid balanceado y cards de altura igual */}
      <section className="py-16 bg-white/70 backdrop-blur-sm">
  <div className="container mx-auto px-4">
    <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">Todo lo que necesitas</h3>

    {/* Grid: responsive; lg:grid-cols-5 coloca las 5 cards en una sola fila en pantallas grandes */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
      {/* Catálogo */}
      <Card className="h-full flex flex-col justify-between border border-red-100 hover:shadow-2xl transition-transform duration-300 hover:-translate-y-1 bg-white">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
            <Package className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-gray-800 font-semibold">
            <Link href="/catalogo" className="hover:underline text-red-600">
              Catálogo Completo
            </Link>
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Explora nuestra amplia gama de productos personalizables
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Fechas */}
      <Card className="h-full flex flex-col justify-between border border-violet-100 hover:shadow-2xl transition-transform duration-300 hover:-translate-y-1 bg-white">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br from-indigo-400 to-violet-500 shadow-sm">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-gray-800 font-semibold">
            <Link href="/calendario" className="hover:underline text-violet-600">
              Fechas Especiales
            </Link>
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Calendario con fechas importantes para tus regalos perfectos
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Kits */}
      <Card className="h-full flex flex-col justify-between border border-sky-100 hover:shadow-2xl transition-transform duration-300 hover:-translate-y-1 bg-white">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br from-sky-400 to-indigo-400 shadow-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          <CardTitle className="text-gray-800 font-semibold">
            <Link href="/kits" className="hover:underline text-indigo-600">
              Kits Especiales
            </Link>
          </CardTitle>

          <CardDescription className="text-sm text-gray-600">
            Combos y paquetes diseñados para ocasiones especiales
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Cotización Rápida */}
      <Card className="h-full flex flex-col justify-between border border-pink-100 hover:shadow-2xl transition-transform duration-300 hover:-translate-y-1 bg-white">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br from-pink-500 to-rose-500 shadow-sm">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-gray-800 font-semibold">
            <Link href="/cotizacion" className="hover:underline text-pink-600">
              Cotización Rápida
            </Link>
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Solicita presupuestos personalizados de forma sencilla
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Atención Personal */}
      <Card className="h-full flex flex-col justify-between border border-red-100 hover:shadow-2xl transition-transform duration-300 hover:-translate-y-1 bg-white">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-gray-800 font-semibold">
            <Link href="/contacto" className="hover:underline text-red-600">
              Atención Personal
            </Link>
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Contacto directo para resolver todas tus dudas
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  </div>
</section>


      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Image src="/logo.png" alt="Eternal Love" width={32} height={32} className="rounded-full" />
            <span className="text-xl font-bold">Eternal Love</span>
          </div>
          <p className="text-gray-400">© 2025 Eternal Love. Personalización con amor desde el corazón.</p>
        </div>
      </footer>
    </div>
  );
}
