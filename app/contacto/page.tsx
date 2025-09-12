"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  Send,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Instagram,
  Facebook,
  Video,
  Youtube,
  ExternalLink,
} from "lucide-react";
import { socialLinks, contactInfo, generateMessageId, type ContactMessage } from "@/lib/contact";
import { Header } from "@/components/header";

const iconMap: Record<string, any> = {
  "message-circle": MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  video: Video,
  youtube: Youtube,
};

// helper: leave only digits
function sanitizePhoneNumber(s?: string) {
  if (!s) return "";
  return String(s).replace(/\D/g, "");
}

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const getSocialColor = (color: string) => {
    const colorMap: Record<string, string> = {
      green: "text-green-600 hover:text-green-700 border-green-200 hover:border-green-300",
      pink: "text-pink-600 hover:text-pink-700 border-pink-200 hover:border-pink-300",
      blue: "text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300",
      black: "text-gray-800 hover:text-gray-900 border-gray-200 hover:border-gray-300",
      red: "text-red-600 hover:text-red-700 border-red-200 hover:border-red-300",
    };
    return colorMap[color] || "text-gray-600 hover:text-gray-700 border-gray-200 hover:border-gray-300";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const contactMessage: ContactMessage = {
      id: generateMessageId(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      subject: formData.subject,
      message: formData.message,
      createdAt: new Date(),
      status: "new",
    };

    // Aquí debes enviar contactMessage a tu backend / Firestore si lo deseas.
    // Por ahora lo registramos en consola y simulamos envío.
    console.log("Contact message (will be sent to backend):", contactMessage);

    try {
      // Simular pequeño delay (reemplaza con fetch a tu endpoint si quieres guardar)
      await new Promise((res) => setTimeout(res, 800));
    } catch {
      // ignore
    }

    // Construir texto a enviar al admin por WhatsApp
    const waMessage = `Nuevo mensaje de contacto:\n\nNombre: ${contactMessage.name}\nTel: ${contactMessage.phone ?? "-"}\nEmail: ${contactMessage.email}\nAsunto: ${contactMessage.subject}\n\nMensaje:\n${contactMessage.message}\n\nID: ${contactMessage.id}`;

    // Obtener número admin preferente desde NEXT_PUBLIC_ADMIN_PHONE, si no -> fallback contactInfo.whatsapp
    // (NEXT_PUBLIC_* está disponible en cliente con Next)
    const envAdmin = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ADMIN_PHONE ? String(process.env.NEXT_PUBLIC_ADMIN_PHONE) : "";
    const fallbackAdmin = contactInfo?.whatsapp ?? "";
    const adminRaw = envAdmin || fallbackAdmin || "";
    const adminDigits = sanitizePhoneNumber(adminRaw);

    const encoded = encodeURIComponent(waMessage);

    if (adminDigits && adminDigits.length >= 7) {
      // Detect simple mobile
      const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      try {
        if (isMobile) {
          // Try to open native app
          const nativeUrl = `whatsapp://send?phone=${adminDigits}&text=${encoded}`;
          // Use location to trigger OS app handler
          window.location.href = nativeUrl;

          // Fallback to wa.me after a short delay in case app is not installed
          setTimeout(() => {
            try {
              window.open(`https://wa.me/${adminDigits}?text=${encoded}`, "_blank");
            } catch {
              // ignore
            }
          }, 900);
        } else {
          // Desktop -> open wa.me (WhatsApp Web prompt)
          window.open(`https://wa.me/${adminDigits}?text=${encoded}`, "_blank");
        }
      } catch (err) {
        console.warn("No se pudo abrir WhatsApp automáticamente", err);
        // fallback: copiar al portapapeles
        try {
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            await navigator.clipboard.writeText(waMessage);
            alert("No fue posible abrir WhatsApp automáticamente. Copié el mensaje al portapapeles para que lo envíes manualmente.");
          } else {
            alert("No fue posible abrir WhatsApp automáticamente. Copia manualmente el mensaje y envíalo al admin.");
          }
        } catch {
          alert("No fue posible abrir WhatsApp ni copiar el mensaje. Revisa la configuración.");
        }
      }
    } else {
      // No hay número admin válido -> copiar mensaje
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(waMessage);
          alert("Número de la empresa no configurado. He copiado el mensaje al portapapeles para que lo envíes manualmente.");
        } else {
          alert("Número de la empresa no configurado y no pude copiar el mensaje al portapapeles.");
        }
      } catch {
        alert("Número de la empresa no configurado y no pude copiar el mensaje al portapapeles.");
      }
    }

    // feedback y reset formulario
    setIsSubmitting(false);
    alert("¡Mensaje enviado exitosamente! Te contactaremos pronto.");
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Contáctanos</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Envíanos un mensaje o síguenos en nuestras redes sociales.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <Send className="w-5 h-5 mr-2" />
                Envíanos un Mensaje
              </CardTitle>
              <CardDescription>Completa el formulario y te responderemos lo antes posible.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Tu nombre completo" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="tu@email.com" required />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono (Opcional)</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+57 300 123 4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Asunto *</Label>
                    <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="¿En qué podemos ayudarte?" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje *</Label>
                  <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Cuéntanos más detalles sobre tu consulta o proyecto..." rows={5} required />
                </div>

                <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-lg py-6" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando mensaje..." : (<><Send className="w-5 h-5 mr-2" />Enviar Mensaje</>)}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Details */}
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <Phone className="w-5 h-5 mr-2" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <a href={`https://wa.me/${sanitizePhoneNumber(contactInfo.whatsapp)}?text=Hola%20Eternal%20Love`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                      {contactInfo.whatsapp}
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <a href={`tel:${contactInfo.phone}`} className="text-blue-600 hover:text-blue-700">
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Correo Electrónico</p>
                    <a href={`mailto:${contactInfo.email}`} className="text-red-600 hover:text-red-700">
                      {contactInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Dirección</p>
                    <p className="text-gray-600">{contactInfo.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card className="border-amber-100">
              <CardHeader>
                <CardTitle className="flex items-center text-amber-600">
                  <Clock className="w-5 h-5 mr-2" />
                  Horarios de Atención
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Lunes a Viernes</span>
                  <span className="text-gray-600">8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sábados</span>
                  <span className="text-gray-600">9:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Domingos</span>
                  <span className="text-gray-600">Cerrado</span>
                </div>
                <Separator className="my-3" />
                <p className="text-sm text-gray-600">* Los mensajes enviados fuera del horario de atención serán respondidos el siguiente día hábil.</p>
              </CardContent>
            </Card>

            {/* Quick Contact */}
            <Card className="border-green-100 bg-green-50/50">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">¿Necesitas ayuda inmediata?</h3>
                    <p className="text-sm text-green-700">Chatea con nosotros por WhatsApp</p>
                  </div>
                  <Button asChild className="bg-green-600 hover:bg-green-700 w-full">
                    <a href={socialLinks[0].url} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Abrir WhatsApp
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Social Media Section */}
        <Card className="mt-8 border-sky-100">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center text-sky-600">
              <Heart className="w-5 h-5 mr-2" />
              Síguenos en Redes Sociales
            </CardTitle>
            <CardDescription>Mantente al día con nuestras últimas creaciones y ofertas especiales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {socialLinks.map((social) => {
                const IconComponent = iconMap[social.icon as keyof typeof iconMap] || MessageCircle;
                return (
                  <Card key={social.platform} className={`hover:shadow-lg transition-all duration-300 border-2 ${getSocialColor(social.color)}`}>
                    <CardContent className="p-4 text-center">
                      <div className="space-y-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                          social.color === "green" ? "bg-green-100" :
                          social.color === "pink" ? "bg-pink-100" :
                          social.color === "blue" ? "bg-blue-100" :
                          social.color === "black" ? "bg-gray-100" :
                          social.color === "red" ? "bg-red-100" : "bg-gray-100"
                        }`}>
                          <IconComponent className={`w-6 h-6 ${
                            social.color === "green" ? "text-green-600" :
                            social.color === "pink" ? "text-pink-600" :
                            social.color === "blue" ? "text-blue-600" :
                            social.color === "black" ? "text-gray-800" :
                            social.color === "red" ? "text-red-600" : "text-gray-600"
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{social.platform}</h3>
                          <p className="text-xs text-gray-600">{social.followers}</p>
                        </div>
                        <Button asChild variant="outline" size="sm" className={`w-full ${getSocialColor(social.color)}`}>
                          <a href={social.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Seguir
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
