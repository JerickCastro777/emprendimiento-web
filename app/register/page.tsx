"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, ArrowLeft } from "lucide-react"
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';


export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

 try {
  if (!auth) throw new Error('Auth no está disponible todavía');

  const cred = await createUserWithEmailAndPassword(
    auth,
    formData.email,
    formData.password
  );

  if (formData.name) {
    await updateProfile(cred.user, { displayName: formData.name });
  }

  alert('✅ Cuenta creada: ' + (cred.user.email ?? ''));
  // Si quieres: router.push('/login')
} catch (err: any) {
  const code = err?.code || '';
  const msg =
    code === 'auth/email-already-in-use' ? 'Ese correo ya está registrado' :
    code === 'auth/invalid-email'        ? 'Correo inválido' :
    code === 'auth/weak-password'        ? 'La contraseña debe tener al menos 6 caracteres' :
    code === 'auth/network-request-failed' ? 'Error de red. Revisa tu conexión' :
    err?.message || 'Error al registrar';
  alert('❌ ' + msg);
} finally {
  setIsLoading(false);
}

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-600">Eternal Love</h1>
              <p className="text-sm text-gray-600">Personalización con amor</p>
            </div>
          </div>
        </div>

        <Card className="border-red-100 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-800">Crear Cuenta</CardTitle>
            <CardDescription>Únete a nuestra familia de clientes especiales</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="border-gray-200 focus:border-red-300 focus:ring-red-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="border-gray-200 focus:border-red-300 focus:ring-red-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="border-gray-200 focus:border-red-300 focus:ring-red-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="border-gray-200 focus:border-red-300 focus:ring-red-200"
                />
              </div>
              <Button type="submit" className="w-full bg-red-500 hover:bg-red-600" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-red-600 hover:text-red-700 font-medium">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
