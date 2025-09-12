export interface SpecialDate {
  id: string
  name: string
  date: string // MM-DD format for recurring dates
  year?: number // For specific year dates
  description: string
  category: "amor" | "familia" | "amistad" | "celebracion" | "religioso"
  giftSuggestions: string[]
  color: string
  icon: string
  daysUntil?: number
}

// Colombian and international special dates
export const specialDates: SpecialDate[] = [
  {
    id: "san-valentin",
    name: "Día de San Valentín",
    date: "02-14",
    description: "Celebra el amor con regalos personalizados únicos para tu pareja especial.",
    category: "amor",
    giftSuggestions: ["Camisetas de pareja", "Pocillos personalizados", "Kit romántico"],
    color: "red",
    icon: "heart",
  },
  {
    id: "dia-madre",
    name: "Día de la Madre",
    date: "05-12", // Second Sunday of May in Colombia
    description: "Honra a mamá con un regalo hecho con amor y personalizado especialmente para ella.",
    category: "familia",
    giftSuggestions: ["Pocillo personalizado", "Camiseta con mensaje", "Estampados familiares"],
    color: "pink",
    icon: "heart",
  },
  {
    id: "dia-padre",
    name: "Día del Padre",
    date: "06-16", // Third Sunday of June in Colombia
    description: "Demuestra tu amor por papá con regalos únicos y personalizados.",
    category: "familia",
    giftSuggestions: ["Camiseta personalizada", "Pocillo de oficina", "Llavero personalizado"],
    color: "blue",
    icon: "user",
  },
  {
    id: "dia-amistad",
    name: "Día del Amor y la Amistad",
    date: "09-21", // Third Saturday of September in Colombia
    description: "Celebra la amistad con regalos especiales para tus amigos más queridos.",
    category: "amistad",
    giftSuggestions: ["Kit de amistad", "Camisetas grupales", "Estampados divertidos"],
    color: "yellow",
    icon: "users",
  },
  {
    id: "halloween",
    name: "Halloween",
    date: "10-31",
    description: "Disfraces y accesorios personalizados para una noche de terror divertida.",
    category: "celebracion",
    giftSuggestions: ["Camisetas temáticas", "Estampados de terror", "Accesorios de disfraces"],
    color: "orange",
    icon: "ghost",
  },
  {
    id: "navidad",
    name: "Navidad",
    date: "12-25",
    description: "La época más especial del año merece regalos únicos y personalizados.",
    category: "religioso",
    giftSuggestions: ["Kit navideño", "Camisetas familiares", "Pocillos navideños"],
    color: "green",
    icon: "gift",
  },
  {
    id: "ano-nuevo",
    name: "Año Nuevo",
    date: "01-01",
    description: "Comienza el año con regalos especiales y propósitos renovados.",
    category: "celebracion",
    giftSuggestions: ["Camisetas motivacionales", "Pocillos de año nuevo", "Kit de propósitos"],
    color: "purple",
    icon: "calendar",
  },
  {
    id: "dia-mujer",
    name: "Día Internacional de la Mujer",
    date: "03-08",
    description: "Celebra la fuerza y belleza de las mujeres con regalos empoderados.",
    category: "celebracion",
    giftSuggestions: ["Camisetas empoderadas", "Pocillos inspiracionales", "Estampados motivacionales"],
    color: "purple",
    icon: "crown",
  },
  {
    id: "dia-nino",
    name: "Día del Niño",
    date: "04-27", // Last Saturday of April in Colombia
    description: "Regalos divertidos y coloridos para los más pequeños de la casa.",
    category: "familia",
    giftSuggestions: ["Camisetas infantiles", "Estampados divertidos", "Accesorios coloridos"],
    color: "rainbow",
    icon: "baby",
  },
  {
    id: "graduaciones",
    name: "Temporada de Graduaciones",
    date: "06-15",
    description: "Celebra los logros académicos con regalos personalizados únicos.",
    category: "celebracion",
    giftSuggestions: ["Camisetas de graduación", "Pocillos conmemorativos", "Kit de graduado"],
    color: "gold",
    icon: "graduation-cap",
  },
]

export function getUpcomingDates(limit = 5): SpecialDate[] {
  const today = new Date()
  const currentYear = today.getFullYear()

  const datesWithCalculatedDays = specialDates.map((date) => {
    const [month, day] = date.date.split("-").map(Number)
    let targetDate = new Date(currentYear, month - 1, day)

    // If the date has passed this year, use next year
    if (targetDate < today) {
      targetDate = new Date(currentYear + 1, month - 1, day)
    }

    const timeDiff = targetDate.getTime() - today.getTime()
    const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24))

    return {
      ...date,
      daysUntil,
    }
  })

  return datesWithCalculatedDays.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0)).slice(0, limit)
}

export function getDatesByCategory(category: SpecialDate["category"]): SpecialDate[] {
  return specialDates.filter((date) => date.category === category)
}

export function getDatesByMonth(month: number): SpecialDate[] {
  return specialDates.filter((date) => {
    const [dateMonth] = date.date.split("-").map(Number)
    return dateMonth === month
  })
}

export function formatDaysUntil(days: number): string {
  if (days === 0) return "¡Hoy!"
  if (days === 1) return "¡Mañana!"
  if (days <= 7) return `En ${days} días`
  if (days <= 30) return `En ${Math.ceil(days / 7)} semanas`
  return `En ${Math.ceil(days / 30)} meses`
}

export const categoryColors = {
  amor: "red",
  familia: "blue",
  amistad: "yellow",
  celebracion: "purple",
  religioso: "green",
}

export const categoryLabels = {
  amor: "Amor",
  familia: "Familia",
  amistad: "Amistad",
  celebracion: "Celebración",
  religioso: "Religioso",
}
