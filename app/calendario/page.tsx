// app/calendario/page.tsx
"use client";

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Heart,
  ArrowLeft,
  CalendarIcon,
  Gift,
  Users,
  User,
  Crown,
  Baby,
  GraduationCap,
  Ghost,
  Sparkles,
  Clock,
} from "lucide-react"
import {
  specialDates,
  getUpcomingDates,
  getDatesByCategory,
  formatDaysUntil,
  categoryLabels,
  type SpecialDate,
} from "@/lib/special-dates"

const iconMap = {
  heart: Heart,
  user: User,
  users: Users,
  gift: Gift,
  calendar: CalendarIcon,
  crown: Crown,
  baby: Baby,
  "graduation-cap": GraduationCap,
  ghost: Ghost,
  sparkles: Sparkles,
}

export default function CalendarioPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedMonth, setSelectedMonth] = useState<string>("all")

  const upcomingDates = getUpcomingDates(6)

  const months = [
    { value: "all", label: "Todos los meses" },
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ]

  const getFilteredDates = (): SpecialDate[] => {
    let filtered = specialDates

    if (selectedCategory !== "all") {
      filtered = getDatesByCategory(selectedCategory as SpecialDate["category"])
    }

    if (selectedMonth !== "all") {
      filtered = filtered.filter((date) => {
        const [month] = date.date.split("-").map(Number)
        return month === Number.parseInt(selectedMonth)
      })
    }

    return filtered
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      red: "border-red-200 bg-red-50 text-red-700",
      pink: "border-pink-200 bg-pink-50 text-pink-700",
      blue: "border-blue-200 bg-blue-50 text-blue-700",
      yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
      orange: "border-orange-200 bg-orange-50 text-orange-700",
      green: "border-green-200 bg-green-50 text-green-700",
      purple: "border-purple-200 bg-purple-50 text-purple-700",
      gold: "border-amber-200 bg-amber-50 text-amber-700",
      rainbow: "border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 text-purple-700",
    }
    return colorMap[color as keyof typeof colorMap] || "border-gray-200 bg-gray-50 text-gray-700"
  }

  const DateCard = ({ date, showDaysUntil = false }: { date: SpecialDate; showDaysUntil?: boolean }) => {
    const IconComponent = iconMap[date.icon as keyof typeof iconMap] || CalendarIcon
    const [month, day] = date.date.split("-").map(Number)
    const dateString = `${day} de ${months[month].label}`

    // <-- línea añadida: valor que usaremos para filtrar en catálogo
    const holidayValue = encodeURIComponent(date.id)

    return (
      <Card className={`hover:shadow-lg transition-all duration-300 ${getColorClasses(date.color)}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  date.color === "red"
                    ? "bg-red-100"
                    : date.color === "pink"
                      ? "bg-pink-100"
                      : date.color === "blue"
                        ? "bg-blue-100"
                        : date.color === "yellow"
                          ? "bg-yellow-100"
                          : date.color === "orange"
                            ? "bg-orange-100"
                            : date.color === "green"
                              ? "bg-green-100"
                              : date.color === "purple"
                                ? "bg-purple-100"
                                : date.color === "gold"
                                  ? "bg-amber-100"
                                  : "bg-pink-100"
                }`}
              >
                <IconComponent
                  className={`w-6 h-6 ${
                    date.color === "red"
                      ? "text-red-600"
                      : date.color === "pink"
                        ? "text-pink-600"
                        : date.color === "blue"
                          ? "text-blue-600"
                          : date.color === "yellow"
                            ? "text-yellow-600"
                            : date.color === "orange"
                              ? "text-orange-600"
                              : date.color === "green"
                                ? "text-green-600"
                                : date.color === "purple"
                                  ? "text-purple-600"
                                  : date.color === "gold"
                                    ? "text-amber-600"
                                    : "text-pink-600"
                  }`}
                />
              </div>
              <div>
                <CardTitle className="text-lg">{date.name}</CardTitle>
                <p className="text-sm opacity-75">{dateString}</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge variant="secondary" className="capitalize">
                {categoryLabels[date.category]}
              </Badge>
              {showDaysUntil && date.daysUntil !== undefined && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDaysUntil(date.daysUntil)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="mb-4 leading-relaxed">{date.description}</CardDescription>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-2">Sugerencias de regalos:</h4>
              <div className="flex flex-wrap gap-1">
                {date.giftSuggestions.map((suggestion, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button size="sm" className="flex-1 bg-red-500 hover:bg-red-600" asChild>
                <Link href={`/catalogo?holiday=${holidayValue}`}>Ver Productos</Link>
              </Button>
              <Button size="sm" variant="outline" className="flex-1 bg-transparent" asChild>
                <Link href="/cotizacion">Cotizar</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-lg font-bold text-red-600">Eternal Love</span>
            </div>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Calendario de Fechas Especiales</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            No te pierdas ninguna fecha importante. Planifica tus regalos personalizados con anticipación.
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="upcoming" className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Próximas Fechas
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Todas las Fechas
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Dates */}
          <TabsContent value="upcoming" className="space-y-6">
            <Card className="border-amber-100 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center text-amber-700">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Próximas Fechas Especiales
                </CardTitle>
                <CardDescription>
                  Las fechas más cercanas para que puedas planificar tus regalos perfectos.
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingDates.map((date) => (
                <DateCard key={date.id} date={date} showDaysUntil={true} />
              ))}
            </div>
          </TabsContent>

          {/* All Dates */}
          <TabsContent value="all" className="space-y-6">
            {/* Filters */}
            <Card className="border-gray-100">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        <SelectItem value="amor">Amor</SelectItem>
                        <SelectItem value="familia">Familia</SelectItem>
                        <SelectItem value="amistad">Amistad</SelectItem>
                        <SelectItem value="celebracion">Celebración</SelectItem>
                        <SelectItem value="religioso">Religioso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por mes" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All Dates Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredDates().map((date) => (
                <DateCard key={date.id} date={date} />
              ))}
            </div>

            {getFilteredDates().length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No se encontraron fechas</h3>
                <p className="text-gray-600">Intenta con otros filtros para ver más fechas especiales.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
