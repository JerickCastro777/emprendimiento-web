"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const authCtx = useAuth();
  // si el contexto exporta login, lo usamos. Si no existe, usamos fallback a Firebase.
  const loginFn = (authCtx as any)?.login;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function fallbackSignIn(emailStr: string, pass: string) {
    // fallback usando Firebase directamente (evita crash si login no existe)
    return await signInWithEmailAndPassword(firebaseAuth, emailStr, pass);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let resultUser: any = null;
      if (typeof loginFn === "function") {
        // si el contexto tiene login (tu lógica original), úsala
        resultUser = await loginFn(email.trim(), password);
      } else {
        // fallback: usar Firebase signIn para no romper
        const resp = await fallbackSignIn(email.trim(), password);
        resultUser = resp?.user ?? null;
      }

      // Si tu login devuelve un objeto con role, redirige según role; si no, manda a home
      const role = resultUser?.role ?? resultUser?.claims?.role ?? null;

      // Si la lógica de tu proyecto usa custom claims o un doc users para role,
      // la redirección puede gestionarla el auth-context; aquí hacemos un fallback razonable.
      if (role === "admin") {
        router.push("/admin");
      } else {
        // si no sabemos, enviamos al inicio y deja que auth-context administre
        router.push("/");
      }
    } catch (err: any) {
      console.error("login error:", err);
      const msg =
        err?.message ||
        (err?.code ? `Error: ${err.code}` : "No se pudo iniciar sesión. Revisa credenciales.");
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50 p-6">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-center mb-6">
          {/* LOGO AGRANDADO sólo en login */}
          <div className="relative w-28 h-28 md:w-36 md:h-36">
            <Image src="/logo.png" alt="Logo Eternal Love" fill className="object-contain" priority />
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-transparent">
          <div
            className="px-8 py-8"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,45,111,0.03) 0%, rgba(123,75,255,0.03) 50%, rgba(61,211,255,0.02) 100%)",
            }}
          >
            <h2 className="text-3xl font-extrabold text-[#0f1724] mb-1 text-center">
              Inicia sesión en <span style={{ color: "rgb(255,45,111)" }}>Eternal</span>{" "}
              <span style={{ color: "rgb(123,75,255)" }}>Love</span>
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Accede al panel si eres administrador.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200 transition"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={visible ? "text" : "password"}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-pink-200 transition"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((s) => !s)}
                    aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 hover:bg-gray-100/60 transition"
                  >
                    {visible ? <EyeOff className="w-5 h-5 text-gray-600" /> : <Eye className="w-5 h-5 text-gray-600" />}
                  </button>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Iniciando..." : "Iniciar sesión"}
                </Button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
