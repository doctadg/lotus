"use client"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import Image from "next/image"

interface AdaptiveFeatureCardProps {
  icon?: LucideIcon
  image?: string
  title: string
  description: string
  gradient: [string, string]
  delay?: number
}

export default function AdaptiveFeatureCard({
  icon: Icon,
  image,
  title,
  description,
  gradient,
  delay = 0,
}: AdaptiveFeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="group relative"
    >
      {/* Glass Background */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10"></div>

      {/* Content */}
      <div className="relative p-3 sm:p-4 md:p-5 min-h-[240px] sm:min-h-[260px] md:min-h-[280px] flex flex-col">
        {/* Full Width Image or Icon */}
        {image ? (
          <div className="w-full h-32 sm:h-36 md:h-40 overflow-hidden rounded-t-xl sm:rounded-t-2xl mb-2 sm:mb-2.5 md:mb-3">
            <Image
              src={image}
              alt={title}
              width={400}
              height={160}
              className="w-full h-full object-cover"
            />
          </div>
        ) : Icon ? (
          <div
            className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-xl sm:rounded-2xl mb-2 sm:mb-2.5 md:mb-3 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
            }}
          >
            <Icon className="w-6 h-6 sm:w-6.5 sm:h-6.5 md:w-7 md:h-7 text-white" />
          </div>
        ) : null}

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2 leading-tight">{title}</h3>

        {/* Description */}
        <p className="text-white/70 text-sm sm:text-base leading-relaxed flex-grow">{description}</p>

      </div>
    </motion.div>
  )
}
