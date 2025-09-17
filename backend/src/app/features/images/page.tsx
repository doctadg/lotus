import Link from 'next/link'
import { ImageIcon, Wand2, Palette, Zap, CheckCircle, ArrowRight, Layers, Brush, Sparkles } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import FadeInView from '@/components/landing/FadeInView'
import StaggerChildren from '@/components/landing/StaggerChildren'
import HoverCard from '@/components/landing/HoverCard'
import { Button } from '@/components/ui/button'

export default function ImagesFeaturePage() {
  const imageCapabilities = [
    {
      icon: Sparkles,
      title: "Text-to-Image Generation",
      description: "Create stunning images from natural language descriptions with advanced AI models.",
      examples: [
        "Generate artwork in any style or medium",
        "Create product mockups and visualizations",
        "Design characters, landscapes, and scenes",
        "Produce high-resolution images for professional use"
      ]
    },
    {
      icon: Brush,
      title: "Intelligent Image Editing",
      description: "Edit existing images using natural language instructions and AI-powered tools.",
      examples: [
        "Remove or replace objects seamlessly",
        "Change backgrounds and environments",
        "Adjust lighting, colors, and atmosphere",
        "Add or modify elements with precise control"
      ]
    },
    {
      icon: Palette,
      title: "Style Adaptation",
      description: "AI that learns your aesthetic preferences and maintains consistency across projects.",
      examples: [
        "Remembers your preferred artistic styles",
        "Maintains brand consistency across images",
        "Adapts to your creative vision over time",
        "Suggests style improvements and variations"
      ]
    },
    {
      icon: Layers,
      title: "Advanced Controls",
      description: "Professional-grade tools for precise control over image generation and editing.",
      examples: [
        "Aspect ratio and resolution control",
        "Composition and framing guidance",
        "Color palette specification",
        "Iteration and refinement tools"
      ]
    }
  ]

  const useCases = [
    {
      title: "Marketing & Advertising",
      icon: "📈",
      description: "Create compelling visual content for campaigns",
      details: [
        "Product photography and lifestyle shots",
        "Social media graphics and ads",
        "Campaign concepts and mood boards",
        "A/B testing with visual variations"
      ]
    },
    {
      title: "Content Creation",
      icon: "📝",
      description: "Visual content that perfectly matches your writing",
      details: [
        "Blog post illustrations and headers",
        "Social media content and thumbnails",
        "Presentation graphics and diagrams",
        "Custom artwork for any topic"
      ]
    },
    {
      title: "E-commerce",
      icon: "🛍️",
      description: "Professional product visuals at scale",
      details: [
        "Product shots in various environments",
        "Lifestyle and usage scenarios",
        "Seasonal and themed variations",
        "Custom backgrounds and settings"
      ]
    },
    {
      title: "Creative Projects",
      icon: "🎨",
      description: "Unlimited creative possibilities",
      details: [
        "Concept art and character design",
        "Storyboard creation and visualization",
        "Artistic exploration and experimentation",
        "Style studies and reference material"
      ]
    }
  ]

  const imageWorkflow = [
    {
      step: "1",
      title: "Describe Your Vision",
      description: "Use natural language to describe what you want to create or modify.",
      icon: "💭"
    },
    {
      step: "2",
      title: "AI Generation",
      description: "Advanced AI models interpret your description and create high-quality images.",
      icon: "🤖"
    },
    {
      step: "3",
      title: "Refine & Iterate",
      description: "Make adjustments, try variations, and perfect your image with intelligent tools.",
      icon: "✨"
    },
    {
      step: "4",
      title: "Export & Use",
      description: "Download high-resolution images ready for any professional application.",
      icon: "📱"
    }
  ]

  return (
    <PageLayout
      title="Image Generation & Editing"
      subtitle="Create, edit, and perfect images with AI that understands your creative vision"
      showBackButton
      backHref="/features"
      backText="Back to Features"
      maxWidth="6xl"
    >
      {/* Hero Section */}
      <FadeInView direction="up" className="mb-20">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-12 text-center">
          <ImageIcon className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            Beyond Traditional Image Tools
          </h2>
          <p className="text-xl text-neutral-600 dark:text-white/70 max-w-3xl mx-auto">
            Create and edit images with the power of natural language. No complex software to learn -
            just describe what you want and watch AI bring your vision to life.
          </p>
        </div>
      </FadeInView>

      {/* Image Capabilities */}
      <FadeInView direction="up" className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          Powerful Image Capabilities
        </h2>
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-8" stagger={0.1}>
          {imageCapabilities.map((capability, index) => (
            <HoverCard
              key={index}
              className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8"
              scale={1.02}
            >
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-6">
                <capability.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>

              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                {capability.title}
              </h3>

              <p className="text-neutral-600 dark:text-white/70 mb-6 leading-relaxed">
                {capability.description}
              </p>

              <div className="space-y-3">
                {capability.examples.map((example, exampleIndex) => (
                  <div key={exampleIndex} className="flex items-start space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-neutral-700 dark:text-white/80 text-sm">{example}</span>
                  </div>
                ))}
              </div>
            </HoverCard>
          ))}
        </StaggerChildren>
      </FadeInView>

      {/* Workflow */}
      <FadeInView direction="up" className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          Simple Creative Workflow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {imageWorkflow.map((step, index) => (
            <HoverCard
              key={index}
              className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6 text-center"
              scale={1.05}
            >
              <div className="text-4xl mb-4">{step.icon}</div>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">
                {step.step}
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">
                {step.title}
              </h3>
              <p className="text-neutral-600 dark:text-white/70 text-sm leading-relaxed">
                {step.description}
              </p>
            </HoverCard>
          ))}
        </div>
      </FadeInView>

      {/* Use Cases */}
      <FadeInView direction="up" className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          Real-World Applications
        </h2>
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-8" stagger={0.1}>
          {useCases.map((useCase, index) => (
            <HoverCard
              key={index}
              className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8"
              scale={1.02}
            >
              <div className="text-4xl mb-4">{useCase.icon}</div>

              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                {useCase.title}
              </h3>

              <p className="text-neutral-600 dark:text-white/70 mb-6 leading-relaxed">
                {useCase.description}
              </p>

              <div className="space-y-3">
                {useCase.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-neutral-700 dark:text-white/80 text-sm">{detail}</span>
                  </div>
                ))}
              </div>
            </HoverCard>
          ))}
        </StaggerChildren>
      </FadeInView>

      {/* Comparison */}
      <FadeInView direction="up" className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          AI vs Traditional Tools
        </h2>
        <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-white/5">
                <tr>
                  <th className="text-left p-6 font-semibold text-neutral-900 dark:text-white">Aspect</th>
                  <th className="text-center p-6 font-semibold text-neutral-900 dark:text-white">Lotus AI</th>
                  <th className="text-center p-6 font-semibold text-neutral-600 dark:text-white/70">Traditional Tools</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    aspect: "Learning Curve",
                    lotus: "Natural language commands",
                    traditional: "Months/years of training"
                  },
                  {
                    aspect: "Speed",
                    lotus: "Seconds to minutes",
                    traditional: "Hours to days"
                  },
                  {
                    aspect: "Cost",
                    lotus: "$5/month all-inclusive",
                    traditional: "$50-100+/month per tool"
                  },
                  {
                    aspect: "Style Consistency",
                    lotus: "AI remembers preferences",
                    traditional: "Manual style guides"
                  },
                  {
                    aspect: "Iteration Speed",
                    lotus: "Instant variations",
                    traditional: "Start from scratch each time"
                  },
                  {
                    aspect: "Skill Requirements",
                    lotus: "Creative vision only",
                    traditional: "Technical expertise needed"
                  }
                ].map((row, index) => (
                  <tr key={index} className="border-t border-neutral-200 dark:border-white/10">
                    <td className="p-6 font-medium text-neutral-900 dark:text-white">{row.aspect}</td>
                    <td className="p-6 text-center text-green-600 dark:text-green-400 font-medium">{row.lotus}</td>
                    <td className="p-6 text-center text-neutral-600 dark:text-white/70">{row.traditional}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FadeInView>

      {/* Example Gallery Section */}
      <FadeInView direction="up" className="mb-20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          What You Can Create
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Product Photography",
              description: "Professional product shots with custom backgrounds and lighting",
              prompt: "\"Luxury watch on marble surface with soft studio lighting\""
            },
            {
              title: "Digital Art",
              description: "Original artwork in any style from photorealistic to abstract",
              prompt: "\"Cyberpunk cityscape at sunset with neon reflections\""
            },
            {
              title: "Marketing Graphics",
              description: "Engaging visuals for social media, ads, and presentations",
              prompt: "\"Modern office team collaborating, clean professional style\""
            },
            {
              title: "Character Design",
              description: "Unique characters for games, stories, or brand mascots",
              prompt: "\"Friendly robot assistant, Pixar animation style\""
            },
            {
              title: "Architectural Visualization",
              description: "Building designs and interior spaces before construction",
              prompt: "\"Modern minimalist living room with floor-to-ceiling windows\""
            },
            {
              title: "Fashion & Style",
              description: "Clothing designs, fashion photography, and style concepts",
              prompt: "\"Sustainable fashion collection, earth tones, natural fabrics\""
            }
          ].map((example, index) => (
            <HoverCard
              key={index}
              className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6"
              scale={1.03}
            >
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg mb-4 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-purple-400 dark:text-purple-300" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">
                {example.title}
              </h3>
              <p className="text-neutral-600 dark:text-white/70 text-sm mb-3 leading-relaxed">
                {example.description}
              </p>
              <div className="bg-neutral-50 dark:bg-white/5 rounded-lg p-3">
                <p className="text-xs text-neutral-500 dark:text-white/50 italic">
                  Example: {example.prompt}
                </p>
              </div>
            </HoverCard>
          ))}
        </div>
      </FadeInView>

      {/* CTA */}
      <FadeInView direction="up" className="text-center">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            Start Creating Today
          </h2>
          <p className="text-xl text-neutral-600 dark:text-white/70 mb-8 max-w-2xl mx-auto">
            Experience the future of image creation. No design skills required - just your imagination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8">
                Try Image Tools Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline" className="font-semibold px-8">
                View All Features
              </Button>
            </Link>
          </div>
        </div>
      </FadeInView>
    </PageLayout>
  )
}

export const metadata = {
  title: 'Image Generation & Editing | Lotus Features',
  description: 'Create and edit stunning images with AI. Generate artwork, edit photos, and design graphics using natural language - no technical skills required.',
}