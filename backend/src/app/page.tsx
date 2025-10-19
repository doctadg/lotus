"use client"
import { ArrowRight, Brain, Sparkles, Zap, Shield, Heart, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut } from "@clerk/nextjs"
import { useState } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import TextType from "@/components/landing/TextType"
import ShinyText from "@/components/landing/ShinyText"
import ScrambledText from "@/components/landing/ScrambledText"
import GrayGlowBackground from "@/components/landing/GrayGlowBackground"
import AnimatedBlob from "@/components/landing/AnimatedBlob"
import DynamicNavbar from "@/components/landing/DynamicNavbar"
import FadeInView from "@/components/landing/FadeInView"
import HoverCard from "@/components/landing/HoverCard"
import StaggerChildren from "@/components/landing/StaggerChildren"
import ComparisonDashboard from "@/components/landing/ComparisonDashboard"
import AdaptiveFeatureCard from "@/components/landing/AdaptiveFeatureCard"
import { Logo } from "@/components/ui/Logo"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { scrollYProgress } = useScroll()
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -50])

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white overflow-x-hidden">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-white via-gray-300 to-white z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      <DynamicNavbar />

      {/* Hero Section - Focused on Adaptability */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 sm:pt-24 pb-12 sm:pb-16">
        <GrayGlowBackground intensity={0.6} />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-0"></div>

        <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-8 sm:gap-10 lg:gap-16 items-center">
          {/* Left Column - Evolution-Focused Hero */}
          <FadeInView direction="up" className="max-w-5xl mx-auto lg:mx-0 text-center lg:text-left">
            <motion.div
              className="mb-8 sm:mb-12 md:mb-14"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-4 sm:mb-6 md:mb-8">
                Your AI That <span className="gray-gradient-text font-black">Evolves</span> With You
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-100 font-medium leading-relaxed max-w-3xl mx-auto lg:mx-0">
                Unlike generic chatbots, MROR learns your style, remembers your context, and
                <span className="text-white font-bold"> adapts to become uniquely yours</span>
              </p>
            </motion.div>

            {/* Value Props - Focused on Capabilities */}
            <StaggerChildren className="space-y-5 sm:space-y-6 md:space-y-8 mb-8 sm:mb-10 md:mb-12" stagger={0.15}>
              <div className="space-y-3 sm:space-y-4">
                <motion.div className="flex items-start space-x-2 sm:space-x-3">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white mt-1 flex-shrink-0" />
                  <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                    <span className="font-semibold">Persistent Memory</span> - Builds understanding across all conversations
                  </p>
                </motion.div>
                <motion.div className="flex items-start space-x-2 sm:space-x-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white mt-1 flex-shrink-0" />
                  <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                    <span className="font-semibold">Adaptive Intelligence</span> - Learns your preferences and working style
                  </p>
                </motion.div>
                <motion.div className="flex items-start space-x-2 sm:space-x-3">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white mt-1 flex-shrink-0" />
                  <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                    <span className="font-semibold">Multi-Modal Mastery</span> - Text, images, code, research - all in one place
                  </p>
                </motion.div>
                <motion.div className="flex items-start space-x-2 sm:space-x-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white mt-1 flex-shrink-0" />
                  <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
                    <span className="font-semibold">Privacy First</span> - Your data stays yours, always
                  </p>
                </motion.div>
              </div>

              <p className="text-base sm:text-lg md:text-xl text-white/85 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                Experience AI that doesn't just respond - it <span className="text-white font-bold">understands, learns, and grows</span> with every interaction.
              </p>

              <FadeInView delay={0.5}>
                <div className="premium-card px-4 sm:px-5 md:px-6 py-3 sm:py-4 inline-block">
                  <p className="text-white text-sm sm:text-base font-semibold flex items-center space-x-2 sm:space-x-3">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span>Join <span className="text-green-300 font-bold text-base sm:text-lg">10,000+ professionals</span> using MROR</span>
                  </p>
                </div>
              </FadeInView>
            </StaggerChildren>

            {/* CTA */}
            <FadeInView direction="up" delay={0.8}>
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <SignedOut>
                    <Link href="/register">
                      <HoverCard scale={1.05} y={-2}>
                        <Button
                          size="lg"
                          className="premium-button text-base sm:text-lg md:text-xl font-bold shadow-2xl w-full sm:w-auto"
                        >
                          Start Your AI Evolution
                          <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>
                      </HoverCard>
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/chat">
                      <HoverCard scale={1.05} y={-2}>
                        <Button
                          size="lg"
                          className="premium-button text-base sm:text-lg md:text-xl font-bold shadow-2xl w-full sm:w-auto"
                        >
                          Open MROR
                          <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>
                      </HoverCard>
                    </Link>
                  </SignedIn>

                  <p className="text-center lg:text-left text-gray-300 text-xs sm:text-sm font-medium">
                    14-day free trial • No credit card required
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 md:gap-6 lg:gap-8 text-xs sm:text-sm text-white/60">
                  <span className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full white-glow"></div>
                    <span>$5/month</span>
                  </span>
                  <span className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full white-glow"></div>
                    <span>Cancel anytime</span>
                  </span>
                  <span className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full white-glow"></div>
                    <span className="hidden sm:inline">Your data, your control</span>
                    <span className="sm:hidden">Your data</span>
                  </span>
                </div>
              </div>
            </FadeInView>
          </FadeInView>

          {/* Right Column - Animated Blob */}
          <motion.div
            className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] mt-8 lg:mt-0 flex items-center justify-center"
            style={{ y: yParallax }}
          >
            <AnimatedBlob
              size="xl"
              colors={['#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db']}
              className="opacity-80"
            />
          </motion.div>
        </div>
      </section>


      {/* AI That Adapts to Your World - NEW SECTION */}
      <section className="features-section relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 bg-transparent">
        <GrayGlowBackground intensity={0.3} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInView className="max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-5 md:mb-6 leading-tight px-4">
                AI that adapts to your world
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-3xl mx-auto px-4">
                Stop repeating yourself. Start having real conversations.
              </p>
            </motion.div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-12 sm:mb-16 md:mb-20">
              <AdaptiveFeatureCard
                icon={Brain}
                title="Never repeat yourself"
                description="MROR builds a living memory of your conversations, projects, and preferences"
                gradient={["#6366f1", "#8b5cf6"]}
                delay={0.1}
              />
              <AdaptiveFeatureCard
                icon={Layers}
                title="Speaks your language"
                description="Adapts responses based on your background, expertise level, and goals"
                gradient={["#8b5cf6", "#d946ef"]}
                delay={0.2}
              />
              <AdaptiveFeatureCard
                icon={Sparkles}
                title="Explores with you"
                description="Tracks topics you're curious about and proactively provides insights"
                gradient={["#6366f1", "#3b82f6"]}
                delay={0.3}
              />
              <AdaptiveFeatureCard
                icon={Zap}
                title="Goes deeper"
                description="Comprehensive analysis with verified sources when you need it"
                gradient={["#8b5cf6", "#6366f1"]}
                delay={0.4}
              />
            </div>

            {/* Comparison Dashboard */}
            <div className="mb-12 sm:mb-16 md:mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8 sm:mb-10 md:mb-12 px-4"
              >
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                  See the difference
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-white/60">
                  Compare generic AI responses with MROR's personalized approach
                </p>
              </motion.div>

              <ComparisonDashboard />
            </div>

            {/* Feature List */}
            <FadeInView delay={0.3}>
              <div className="max-w-4xl mx-auto px-4">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">
                  Why MROR adapts to you
                </h3>
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    "Builds living memory from every conversation",
                    "Adapts to your expertise and communication style",
                    "Explores your curiosity with proactive insights",
                    "Deep research mode with comprehensive sources",
                    "Context-aware responses that understand your world",
                    "Never lose track of important topics or goals",
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-center gap-2 sm:gap-3 text-white/80"
                    >
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span className="text-sm sm:text-base">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeInView>
          </FadeInView>
        </div>
      </section>

      {/* Interactive Demo Section - Simplified */}
      <section className="relative z-10 py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950/30 via-black to-gray-950/20"></div>
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInView className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16 md:mb-20 px-4">
              <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-4 sm:mb-6 tracking-tight">Experience Adaptive AI</h2>
              <p className="text-white/70 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
                Watch MROR learn, adapt, and evolve with your unique needs.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
              {/* Left Column - Interactive Features */}
              <StaggerChildren className="space-y-12" stagger={0.2}>
                <HoverCard className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                  <h3 className="dark:text-white text-neutral-900 text-lg font-semibold mb-4">Learning in Real-Time</h3>
                  <ScrambledText
                    className="text-white/90 text-base leading-relaxed"
                    radius={80}
                    duration={1.0}
                    speed={0.6}
                    scrambleChars=".:!@#$%"
                  >
                    MROR observes patterns in your work, adapting its responses to match your style and preferences automatically.
                  </ScrambledText>
                </HoverCard>

                <HoverCard className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                  <h3 className="dark:text-white text-neutral-900 text-lg font-semibold mb-4">Intelligent Code Generation</h3>
                  <div className="dark:text-white/90 text-neutral-800 text-lg">
                    <TextType
                      text={[
                        "Writes code that follows your conventions.",
                        "Understands your project structure instantly.",
                        "Suggests improvements based on your patterns.",
                      ]}
                      typingSpeed={75}
                      pauseDuration={1500}
                      showCursor={true}
                      cursorCharacter="_"
                      className="text-white/90"
                    />
                  </div>
                </HoverCard>
              </StaggerChildren>

              {/* Right Column - Use Cases */}
              <StaggerChildren className="space-y-8" stagger={0.15}>
                <HoverCard className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                  <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center mb-6">
                    <Brain className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="dark:text-white text-neutral-900 text-2xl font-semibold mb-4">Research & Analysis</h3>
                  <p className="dark:text-white/80 text-neutral-700 text-lg leading-relaxed">
                    Deep dive into any topic with an AI that remembers your research context and builds on previous findings.
                  </p>
                </HoverCard>

                <HoverCard className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                  <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="dark:text-white text-neutral-900 text-2xl font-semibold mb-4">Creative Work</h3>
                  <p className="dark:text-white/80 text-neutral-700 text-lg leading-relaxed">
                    Generate content that matches your voice, style, and brand - improving with every creation.
                  </p>
                </HoverCard>

                <HoverCard className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                  <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="dark:text-white text-neutral-900 text-2xl font-semibold mb-4">Strategic Planning</h3>
                  <p className="dark:text-white/80 text-neutral-700 text-lg leading-relaxed">
                    Build complex strategies with an AI that understands your goals and constraints from past discussions.
                  </p>
                </HoverCard>
              </StaggerChildren>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Testimonials Section - Simplified */}
      <section className="relative z-10 py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 dark:bg-gradient-to-r dark:from-gray-950/20 dark:via-black dark:to-gray-950/20"></div>
          <div className="absolute inset-0 dark:bg-black/70"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInView className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16 md:mb-20 px-4">
              <h2 className="dark:text-white text-neutral-900 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light mb-4 sm:mb-6 tracking-tight">
                Loved by Forward-Thinking Teams
              </h2>
              <div className="dark:text-white/70 text-neutral-600 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
                <TextType
                  text={[
                    "See how professionals use MROR to amplify their capabilities.",
                    "Real stories from teams achieving more with adaptive AI.",
                    "Join thousands discovering what personalized AI can do.",
                  ]}
                  typingSpeed={60}
                  pauseDuration={3000}
                  showCursor={false}
                  className="text-white/70"
                />
              </div>
            </div>

            {/* Testimonials Grid */}
            <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8 lg:gap-12 auto-rows-fr" stagger={0.1}>
              {[
                {
                  name: "Sarah Chen",
                  role: "AI Researcher",
                  company: "TechCorp",
                  quote: "MROR's ability to maintain context across research sessions has accelerated my work tremendously.",
                  metric: "70% faster research"
                },
                {
                  name: "Marcus Rodriguez",
                  role: "Lead Developer",
                  company: "StartupXYZ",
                  quote: "It learns our codebase patterns and suggests improvements that actually make sense.",
                  metric: "2x development speed"
                },
                {
                  name: "Aisha Patel",
                  role: "Product Strategist",
                  company: "ScaleUp",
                  quote: "The way MROR remembers our product decisions and strategy is game-changing.",
                  metric: "90% faster planning"
                }
              ].map((testimonial, index) => (
                <HoverCard key={index} className="group bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-base sm:text-lg">
                      {testimonial.name[0]}
                    </div>
                    <div className="ml-3 sm:ml-4">
                      <h4 className="dark:text-white text-neutral-900 font-semibold text-sm sm:text-base">{testimonial.name}</h4>
                      <p className="dark:text-white/60 text-neutral-600 text-xs sm:text-sm">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                  <div className="mb-3 sm:mb-4">
                    <div className="flex space-x-1 mb-2 sm:mb-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full opacity-90"></div>
                      ))}
                    </div>
                    <p className="dark:text-white/90 text-neutral-800 text-sm sm:text-base leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                  </div>
                  <div className="dark:text-white/40 text-neutral-500 text-xs sm:text-sm group-hover:dark:text-white/60 group-hover:text-neutral-700 transition-colors">
                    {testimonial.metric}
                  </div>
                </HoverCard>
              ))}
            </StaggerChildren>

            <FadeInView delay={0.5}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mt-12 sm:mt-16 md:mt-20 pt-8 sm:pt-12 md:pt-16 border-t border-white/10">
                {[
                  { value: "10,000+", label: "Active Users" },
                  { value: "500+", label: "Companies" },
                  { value: "99.9%", label: "Uptime" },
                  { value: "24/7", label: "Support" }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-white mb-1 sm:mb-2">
                      <ShinyText text={stat.value} speed={4} className="text-white" />
                    </div>
                    <div className="text-white/60 text-xs sm:text-sm md:text-base">{stat.label}</div>
                  </div>
                ))}
              </div>
            </FadeInView>
          </FadeInView>
        </div>
      </section>

      {/* Pricing Section - Value-Focused */}
      <section className="pricing-section relative z-10 py-16 sm:py-20 md:py-24 lg:py-32 bg-transparent">
        <GrayGlowBackground intensity={0.4} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInView className="max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div className="text-center mb-12 sm:mb-14 md:mb-16 px-4">
              <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 md:mb-6 tracking-tight">
                Powerful AI, Fair Pricing
              </h2>
              <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-4xl mx-auto mb-6 sm:mb-8">
                Get more capability for less. <span className="text-white font-bold">Advanced AI that grows with you</span> at a price that makes sense.
              </p>
            </motion.div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <HoverCard className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8">
                <div className="text-center mb-5 sm:mb-6">
                  <h3 className="text-white text-xl sm:text-2xl font-semibold mb-2">Explorer</h3>
                  <div className="text-white text-3xl sm:text-4xl font-bold">Free</div>
                  <p className="text-white/60 text-xs sm:text-sm mt-2">Try MROR risk-free</p>
                </div>
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <div className="flex items-center text-white/80">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm">Basic AI conversations</span>
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm">Limited memory (7 days)</span>
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm">10 messages per day</span>
                  </div>
                </div>
                <SignedOut>
                  <Link href="/register">
                    <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm sm:text-base">
                      Start Free
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/chat">
                    <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm sm:text-base">
                      Open MROR
                    </Button>
                  </Link>
                </SignedIn>
              </HoverCard>

              {/* Pro Plan - Featured */}
              <HoverCard className="premium-card backdrop-blur-xl border-2 border-white/20 p-6 sm:p-8 relative md:transform md:scale-105">
                <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white text-black px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold white-glow">
                    MOST POPULAR
                  </div>
                </div>
                <div className="text-center mb-5 sm:mb-6">
                  <h3 className="text-white text-xl sm:text-2xl font-semibold mb-2">Professional</h3>
                  <div className="text-white text-3xl sm:text-4xl font-bold">$5</div>
                  <p className="text-white/60 text-xs sm:text-sm mt-2">/month</p>
                </div>
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <div className="flex items-center text-white/90">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm font-medium">Unlimited conversations</span>
                  </div>
                  <div className="flex items-center text-white/90">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm font-medium">Persistent memory</span>
                  </div>
                  <div className="flex items-center text-white/90">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm font-medium">All AI models</span>
                  </div>
                  <div className="flex items-center text-white/90">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm font-medium">Image generation</span>
                  </div>
                  <div className="flex items-center text-white/90">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm font-medium">Priority support</span>
                  </div>
                </div>
                <SignedOut>
                  <Link href="/register">
                    <Button className="w-full premium-button font-bold text-sm sm:text-base">
                      Start 14-Day Trial
                      <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/chat">
                    <Button className="w-full premium-button font-bold text-sm sm:text-base">
                      Open MROR
                      <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </Link>
                </SignedIn>
              </HoverCard>

              {/* Enterprise Plan */}
              <HoverCard className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8">
                <div className="text-center mb-5 sm:mb-6">
                  <h3 className="text-white text-xl sm:text-2xl font-semibold mb-2">Enterprise</h3>
                  <div className="text-white text-3xl sm:text-4xl font-bold">Custom</div>
                  <p className="text-white/60 text-xs sm:text-sm mt-2">For teams</p>
                </div>
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <div className="flex items-center text-white/80">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm">Everything in Pro</span>
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm">Team collaboration</span>
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm">Custom integrations</span>
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm">Dedicated support</span>
                  </div>
                </div>
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm sm:text-base">
                  Contact Sales
                </Button>
              </HoverCard>
            </div>

            {/* Value Comparison */}
            <FadeInView delay={0.3} className="mt-16 text-center">
              <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8 shadow-sm max-w-3xl mx-auto">
                <h3 className="text-white text-2xl font-bold mb-4">Why Choose MROR?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white/70">
                  <div>
                    <div className="text-3xl font-bold text-green-400 mb-2">75%</div>
                    <p className="text-sm">Less expensive than competitors</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-400 mb-2">100%</div>
                    <p className="text-sm">Privacy guaranteed</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-400 mb-2">∞</div>
                    <p className="text-sm">Learning potential</p>
                  </div>
                </div>
              </div>
            </FadeInView>

            {/* FAQ Section */}
            <FadeInView delay={0.5} className="mt-12 sm:mt-16 md:mt-20 pt-12 sm:pt-14 md:pt-16 border-t border-white/10">
              <h3 className="text-white text-xl sm:text-2xl font-light text-center mb-8 sm:mb-10 md:mb-12 px-4">Common Questions</h3>
              <StaggerChildren className="grid md:grid-cols-2 gap-5 sm:gap-6 md:gap-8" stagger={0.1}>
                <HoverCard className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg sm:rounded-xl p-5 sm:p-6 shadow-sm">
                  <h4 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">How does MROR learn from me?</h4>
                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                    MROR uses advanced memory systems to understand your preferences, writing style, and project context across all conversations.
                  </p>
                </HoverCard>
                <HoverCard className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg sm:rounded-xl p-5 sm:p-6 shadow-sm">
                  <h4 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Is my data really private?</h4>
                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                    Yes. We never train models on your data, and your conversations are encrypted and isolated to your account only.
                  </p>
                </HoverCard>
              </StaggerChildren>
            </FadeInView>
          </FadeInView>
        </div>
      </section>

      {/* Footer Section - Simplified */}
      <footer className="relative z-10 py-16 sm:py-20 border-t dark:border-white/10 border-black/10">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 dark:bg-gradient-to-t dark:from-gray-950/50 dark:via-black dark:to-black bg-gradient-to-t from-gray-100 via-white to-white"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInView className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
              {/* Company Info */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center mb-6">
                  <Logo variant="full" height={48} className="opacity-90" />
                </div>
                <p className="dark:text-white/70 text-neutral-600 text-sm leading-relaxed mb-6">
                  AI that evolves with you. Experience intelligence that adapts, learns, and grows.
                </p>
                {/* Social Links */}
                <div className="flex space-x-4">
                  {[1, 2, 3].map((i) => (
                    <HoverCard key={i} scale={1.1} y={-2}>
                      <a href="#" className="w-10 h-10 dark:bg-white/10 dark:hover:bg-white/20 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center transition-all duration-200">
                        <div className="w-5 h-5 dark:bg-white/70 bg-black/60 rounded-full"></div>
                      </a>
                    </HoverCard>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="dark:text-white text-neutral-900 font-semibold mb-4 sm:mb-6">
                  Product
                </h4>
                <ul className="space-y-3 sm:space-y-4">
                  {['Features', 'Pricing', 'API', 'Changelog'].map((item) => (
                    <li key={item}>
                      <Link href="/pricing" className="dark:text-white/70 text-neutral-600 hover:text-neutral-900 dark:hover:text-white text-sm transition-colors duration-200">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h4 className="dark:text-white text-neutral-900 font-semibold mb-4 sm:mb-6">Company</h4>
                <ul className="space-y-3 sm:space-y-4">
                  {['About', 'Blog', 'Careers', 'Press'].map((item) => (
                    <li key={item}>
                      <a href="#" className="dark:text-white/70 text-neutral-600 hover:text-neutral-900 dark:hover:text-white text-sm transition-colors duration-200">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support Links */}
              <div>
                <h4 className="dark:text-white text-neutral-900 font-semibold mb-4 sm:mb-6">Support</h4>
                <ul className="space-y-3 sm:space-y-4">
                  {['Help Center', 'Documentation', 'Community', 'Contact'].map((item) => (
                    <li key={item}>
                      <a href="#" className="dark:text-white/70 text-neutral-600 hover:text-neutral-900 dark:hover:text-white text-sm transition-colors duration-200">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <HoverCard className="dark:bg-white/5 bg-black/5 backdrop-blur-sm border dark:border-white/10 border-black/10 rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12">
              <div className="max-w-2xl mx-auto text-center">
                <h3 className="dark:text-white text-neutral-900 text-lg sm:text-xl font-semibold mb-4">Stay Updated</h3>
                <p className="dark:text-white/70 text-neutral-600 mb-6 text-sm sm:text-base">
                  Get the latest updates on AI capabilities and features.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 dark:bg-white/10 bg-black/5 dark:border-white/20 border-black/20 rounded-lg dark:text-white text-neutral-900 placeholder-neutral-500 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent backdrop-blur-sm text-sm sm:text-base"
                  />
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:-translate-y-0.5 px-6 text-sm sm:text-base w-full sm:w-auto">
                    Subscribe
                  </Button>
                </div>
              </div>
            </HoverCard>

            <div className="pt-6 sm:pt-8 border-t dark:border-white/10 border-black/10">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 text-center sm:text-left">
                <div className="dark:text-white/60 text-neutral-500 text-xs sm:text-sm order-2 sm:order-1 min-w-0 flex-shrink-0">
                  © 2025 MROR. All rights reserved.
                </div>
                <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 order-1 sm:order-2">
                  {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                    <a
                      key={item}
                      href="#"
                      className="dark:text-white/60 text-neutral-600 hover:text-neutral-900 dark:hover:text-white text-xs sm:text-sm transition-colors duration-200 whitespace-nowrap"
                    >
                      {item}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </FadeInView>
        </div>
      </footer>
    </div>
  )
}