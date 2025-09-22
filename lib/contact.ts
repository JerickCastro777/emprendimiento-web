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
    url: "https://wa.me/573337172063?text=Hola%20Eternal%20Love",
    icon: "message-circle",
    color: "green"
  },
  {
    platform: "Instagram",
    url: "https://www.instagram.com/eternal.love.bog",
    icon: "instagram",
    color: "pink"
  },
  {
    platform: "Facebook",
    url: "",
    icon: "facebook",
    color: "blue"
  },
  {
    platform: "TikTok",
    url: "",
    icon: "video",
    color: "black"
  },
  {
    platform: "YouTube",
    url: "",
    icon: "youtube",
    color: "red"
  },
]

export const contactInfo = {
  phone: "+57 333 717 2063",
  whatsapp: "+57 333 717 2063",
  email: "eternal.lovebog@gmail.com",
  address: "Avenida calle 72# 57 B -43 (Local Interrapidismo), Bogotá, Colombia",
  hours: {
    weekdays: "Lunes a Viernes: 9:00 AM - 6:00 PM",
    saturday: "Sábados: 9:00 AM - 3:00 PM",
    sunday: "Domingos y Festivos: Cerrado",
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
