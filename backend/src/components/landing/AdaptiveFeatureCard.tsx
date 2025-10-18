"use client"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface AdaptiveFeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  gradient: [string, string]
  delay?: number
}

export default function AdaptiveFeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay = 0,
}: AdaptiveFeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="group relative"
    >
      {/* Glass Background */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 group-hover:border-white/20 transition-all duration-300"></div>

      {/* Gradient Glow on Hover */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        style={{
          background: `linear-gradient(135deg, ${gradient[0]}40, ${gradient[1]}40)`,
        }}
      ></div>

      {/* Content */}
      <div className="relative p-8 min-h-[280px] flex flex-col">
        {/* Icon with Gradient */}
        <div
          className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          style={{
            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
          }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3 leading-tight">{title}</h3>

        {/* Description */}
        <p className="text-white/70 text-base leading-relaxed flex-grow">{description}</p>

        {/* Subtle Border Gradient */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${gradient[0]}20, ${gradient[1]}20)`,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            padding: "1px",
          }}
        ></div>
      </div>
    </motion.div>
  )
}
