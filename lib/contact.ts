export interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  createdAt: Date
  status: "new" | "read" | "replied"
}

export interface SocialLink {
  platform: string
  url: string
  icon: string
  color: string
  followers?: string
}

export const socialLinks: SocialLink[] = [
  {
    platform: "WhatsApp",
    url: "https://wa.me/573001234567?text=Hola%20Eternal%20Love,%20me%20interesa%20conocer%20más%20sobre%20sus%20productos%20personalizados",
    icon: "message-circle",
    color: "green",
    followers: "Contacto directo",
  },
  {
    platform: "Instagram",
    url: "https://instagram.com/eternallove_personalizados",
    icon: "instagram",
    color: "pink",
    followers: "2.5K seguidores",
  },
  {
    platform: "Facebook",
    url: "https://facebook.com/eternallove.personalizados",
    icon: "facebook",
    color: "blue",
    followers: "1.8K seguidores",
  },
  {
    platform: "TikTok",
    url: "https://tiktok.com/@eternallove_co",
    icon: "video",
    color: "black",
    followers: "950 seguidores",
  },
  {
    platform: "YouTube",
    url: "https://youtube.com/@EternalLovePersonalizados",
    icon: "youtube",
    color: "red",
    followers: "320 suscriptores",
  },
]

export const contactInfo = {
  phone: "+57 300 123 4567",
  whatsapp: "+57 300 123 4567",
  email: "hola@eternallove.co",
  address: "Calle 123 #45-67, Bogotá, Colombia",
  hours: {
    weekdays: "Lunes a Viernes: 8:00 AM - 6:00 PM",
    saturday: "Sábados: 9:00 AM - 4:00 PM",
    sunday: "Domingos: Cerrado",
  },
}

// Mock data for contact messages
export const mockMessages: ContactMessage[] = [
  {
    id: "msg-001",
    name: "Ana María López",
    email: "ana@email.com",
    phone: "+57 300 987 6543",
    subject: "Consulta sobre camisetas personalizadas",
    message:
      "Hola, me gustaría saber más sobre las camisetas personalizadas para un evento corporativo. Necesitamos aproximadamente 50 unidades.",
    createdAt: new Date("2025-01-20"),
    status: "new",
  },
]

export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getMessagesByStatus(status: ContactMessage["status"]): ContactMessage[] {
  return mockMessages.filter((message) => message.status === status)
}
