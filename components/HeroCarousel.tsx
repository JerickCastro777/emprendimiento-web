// components/HeroCarousel.tsx
// medidas imagenes 1920 × 560 px
"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type HeroCarouselProps = {
  images?: string[];
  interval?: number;
  showControls?: boolean;
};

export default function HeroCarousel({
  images = ["/classic-white-ceramic-mug.png", "/romantic-couple-matching-t-shirts.png", "/romantic-gift-kit-couple.png"],
  interval = 4500,
  showControls = true,
}: HeroCarouselProps) {
  const normalize = (src: string) =>
    src.startsWith("public/") ? `/${src.replace(/^public\//, "")}` : src.startsWith("/") ? src : `/${src}`;

  const slides = (images || []).map((src) => ({ src: normalize(src), alt: src }));
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!isPaused) {
      intervalRef.current = window.setInterval(() => {
        setIndex((i) => (i + 1) % slides.length);
      }, interval);
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [slides.length, interval, isPaused]);

  function goTo(i: number) {
    const n = ((i % slides.length) + slides.length) % slides.length;
    setIndex(n);
  }
  function prev() {
    goTo(index - 1);
  }
  function next() {
    goTo(index + 1);
  }

  if (slides.length === 0) return null;

  return (
    <section
      className="relative w-full h-[480px] sm:h-[520px] md:h-[560px] lg:h-[560px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
    >
      {/* contenedor de slides: ancho total = slides.length * 100% */}
      <div
        className="absolute inset-0 flex transition-transform duration-700 ease-in-out"
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${index * (100 / slides.length)}%)`,
        }}
      >
        {slides.map((s, i) => (
          // <-- CORRECCIÓN: cada slide debe tener width = 100 / slides.length %
          <div
            key={i}
            className="relative h-full flex-shrink-0"
            style={{ width: `${100 / slides.length}%` }}
          >
            {/* 
              object-cover = cubre todo (puede recortar)
              object-contain = muestra la imagen completa (puede dejar espacios)
              Ajusta según prefieras.
            */}
            <Image
              src={s.src}
              alt={s.alt}
              fill
              className="object-cover object-center"
              priority={i === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/20" />
          </div>
        ))}
      </div>

      {/* contenido centrado */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center px-6 pointer-events-auto">
          <div className="mx-auto w-28 h-28 relative mb-6">
            <Image src="/logo.png" alt="Eternal Love" fill className="object-contain" priority />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-5xl font-extrabold text-white drop-shadow-lg">
            Personaliza con{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-300 to-pink-300">
              Amor Eterno
            </span>
          </h1>

          <p className="mt-3 text-md sm:text-lg text-white/90 max-w-2xl mx-auto drop-shadow">
            Camisetas, pocillos, estampados y más. Cada producto personalizado con el cuidado y amor que mereces.
          </p>

          <div className="mt-6 flex gap-4 justify-center">
            <a href="/catalogo" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
              Ver Catálogo
            </a>
            <a href="/cotizacion" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/20 text-white/95 bg-white/10">
              Solicitar Cotización
            </a>
          </div>
        </div>
      </div>

      {/* controles */}
      {showControls && (
        <>
          <button aria-label="Anterior" onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <button aria-label="Siguiente" onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </>
      )}

      {/* indicadores */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, i) => (
          <button key={i} aria-label={`Ir a la diapositiva ${i + 1}`} onClick={() => goTo(i)} className={`w-3 h-3 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`} />
        ))}
      </div>
    </section>
  );
}
