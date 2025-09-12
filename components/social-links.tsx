import { Button } from "@/components/ui/button"
import { MessageCircle, Instagram, Facebook, Video, Youtube, ExternalLink } from "lucide-react"
import { socialLinks } from "@/lib/contact"

const iconMap = {
  "message-circle": MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  video: Video,
  youtube: Youtube,
}

export function SocialLinks({ variant = "default" }: { variant?: "default" | "footer" | "floating" }) {
  if (variant === "floating") {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 rounded-full shadow-lg">
          <a href={socialLinks[0].url} target="_blank" rel="noopener noreferrer" title="Contactar por WhatsApp">
            <MessageCircle className="w-6 h-6" />
          </a>
        </Button>
      </div>
    )
  }

  if (variant === "footer") {
    return (
      <div className="flex justify-center space-x-4">
        {socialLinks.slice(0, 4).map((social) => {
          const IconComponent = iconMap[social.icon as keyof typeof iconMap] || MessageCircle
          return (
            <Button key={social.platform} asChild variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <a href={social.url} target="_blank" rel="noopener noreferrer" title={`Seguir en ${social.platform}`}>
                <IconComponent className="w-5 h-5" />
              </a>
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {socialLinks.map((social) => {
        const IconComponent = iconMap[social.icon as keyof typeof iconMap] || MessageCircle
        return (
          <Button key={social.platform} asChild variant="outline" size="sm">
            <a href={social.url} target="_blank" rel="noopener noreferrer">
              <IconComponent className="w-4 h-4 mr-2" />
              {social.platform}
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        )
      })}
    </div>
  )
}
