// app/layout.tsx
import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Eternal Love - Personalización con Amor",
  description: "Camisetas, pocillos, estampados personalizados. Cada producto hecho con amor.",
  generator: "v0.app",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${inter.variable} ${jetbrainsMono.variable}`}>
        <AuthProvider>
          {children}
          {/* Toaster para notificaciones de react-hot-toast */}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
