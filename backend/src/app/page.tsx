"use client"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import TextType from "@/components/landing/TextType"
import ShinyText from "@/components/landing/ShinyText"
import ScrambledText from "@/components/landing/ScrambledText"
import ScrollStack, { ScrollStackItem } from "@/components/landing/ScrollStack"
import ParticleBackground from "@/components/landing/ParticleBackground"
import DarkVeil from "@/components/landing/DarkVeil"
import DynamicNavbar from "@/components/landing/DynamicNavbar"
import Threads from "@/components/landing/Threads"
import Dither from "@/components/landing/Dither"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen text-white">
      {/* Dynamic Navbar */}
      <DynamicNavbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Dither Background */}
        <div className="absolute inset-0 -z-10">
          <Dither
            waveColor={[0.4, 0.2, 0.5]}
            disableAnimation={false}
            enableMouseInteraction={true}
            mouseRadius={1.0}
            colorNum={8}
            waveAmplitude={0.5}
            waveFrequency={2}
            waveSpeed={0.02}
            pixelSize={4}
          />
        </div>
        {/* Gradient overlay at the bottom of the hero section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-0"></div>

        <div className="relative z-20 container mx-auto px-4 lg:px-8 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Column - Hero Content */}
          <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            {/* Main Headline with enhanced styling */}
            <h1
              className="text-white font-light leading-tight tracking-tight mb-6 relative"
              style={{
                fontSize: "clamp(2rem, 8vw, 4rem)",
                lineHeight: "1.1",
                letterSpacing: "-0.02em",
                background: "linear-gradient(90deg, #ffffff 0%, #e2e8f0 50%, #ffffff 100%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmer 3s ease-in-out infinite",
              }}
            >
              Lotus: Your AI Chat That Learns, Plans & Codes
            </h1>

            {/* Supporting Text */}
            <p
              className="text-white/80 mb-8 max-w-xl mx-auto lg:mx-0"
              style={{
                fontSize: "clamp(1rem, 3vw, 1.25rem)",
                lineHeight: "1.6",
              }}
            >
              Experience Lotus, the intelligent AI chat designed to evolve with you. The more you interact, the smarter
              it becomes, offering unparalleled planning, deep research, advanced reasoning, and powerful coding
              capabilities.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-blue-500/90 hover:bg-blue-500 border border-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 px-6 sm:px-8 py-3 text-sm sm:text-base font-medium w-full sm:w-auto"
              >
                Experience Lotus AI
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 px-6 sm:px-8 py-3 text-sm sm:text-base font-medium w-full sm:w-auto"
              >
                Watch Demo
              </Button>
            </div>
          </div>

          <div className="relative h-[400px] sm:h-[500px] lg:h-[700px] mt-8 lg:mt-0">
            <ParticleBackground className="opacity-70 sm:opacity-80 lg:opacity-90 max-h-[70vh]" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-8 sm:py-12 lg:py-16">
        <div className="absolute inset-0 -z-20">
          <Threads amplitude={1} distance={0} enableMouseInteraction={true} color={[0.3, 0.4, 0.8]} />
        </div>
        {/* Dark gradient background for features section */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-gray-900/50 to-black"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-6 leading-tight">
                <ShinyText text="Lotus AI Capabilities" speed={3} className="text-white" />
              </h2>
              <div className="max-w-2xl mx-auto">
                <TextType
                  text={[
                    "Unleash the power of AI with Lotus's core features.",
                    "From intelligent planning to deep research and coding.",
                    "Experience AI that truly understands and evolves with you.",
                  ]}
                  typingSpeed={75}
                  pauseDuration={2000}
                  showCursor={true}
                  cursorCharacter="|"
                  className="text-white/70 text-lg sm:text-xl"
                  variableSpeed={undefined}
                  onSentenceComplete={undefined}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Feature 1 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg sm:text-xl font-semibold mb-4">Intelligent Planning & Execution</h3>
                <p className="text-white/70 leading-relaxed text-sm sm:text-base">
                  Lotus can break down complex tasks, create detailed plans, and execute them efficiently.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-green-400 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg sm:text-xl font-semibold mb-4">Deep Research & Analysis</h3>
                <p className="text-white/70 leading-relaxed text-sm sm:text-base">
                  Leverage Lotus's ability to conduct thorough research and synthesize information from vast datasets.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-purple-400 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg sm:text-xl font-semibold mb-4">Advanced Reasoning & Problem Solving</h3>
                <p className="text-white/70 leading-relaxed text-sm sm:text-base">
                  Lotus applies sophisticated reasoning to solve problems and provide insightful solutions.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-orange-400 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg sm:text-xl font-semibold mb-4">Personalized Learning & Adaptation</h3>
                <p className="text-white/70 leading-relaxed text-sm sm:text-base">
                  Lotus continuously learns from your interactions, adapting its responses and capabilities to your
                  unique needs and preferences.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-red-400 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg sm:text-xl font-semibold mb-4">Creative Content Generation</h3>
                <p className="text-white/70 leading-relaxed text-sm sm:text-base">
                  From compelling narratives to engaging marketing copy, Lotus can generate diverse and creative content
                  tailored to your specifications.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-teal-400 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg sm:text-xl font-semibold mb-4">Intuitive & Accessible Interface</h3>
                <p className="text-white/70 leading-relaxed text-sm sm:text-base">
                  Designed for ease of use, Lotus provides a seamless and intuitive experience, making advanced AI
                  accessible to everyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="relative z-10 py-32">
        {/* Subtle blue gradient background for demo section */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950/30 via-black to-gray-950/20"></div>
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className="text-white text-4xl lg:text-5xl font-light mb-6 tracking-tight">See Lotus in Action</h2>
              <p className="text-white/70 text-xl max-w-2xl mx-auto">
                Witness the power of Lotus AI as it learns, reasons, and codes in real-time.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Column - Interactive Text */}
              <div className="space-y-12">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                  <h3 className="text-white text-lg font-semibold mb-4">Adaptive Learning</h3>
                  <ScrambledText
                    className="text-white/90 text-base leading-relaxed"
                    radius={80}
                    duration={1.0}
                    speed={0.6}
                    scrambleChars=".:!@#$%"
                  >
                    Lotus continuously learns from your interactions, adapting its responses and capabilities to your
                    unique needs and preferences.
                  </ScrambledText>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                  <h3 className="text-white text-lg font-semibold mb-4">Dynamic Code Generation</h3>
                  <div className="text-white/90 text-lg">
                    <TextType
                      text={[
                        "Generate clean, efficient code in any language.",
                        "Automate repetitive coding tasks with ease.",
                        "Transform ideas into functional code instantly.",
                      ]}
                      typingSpeed={75}
                      pauseDuration={1500}
                      showCursor={true}
                      cursorCharacter="_"
                      className="text-white/90"
                      variableSpeed={undefined}
                      onSentenceComplete={undefined}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Enhanced Feature Cards */}
              <div className="space-y-8">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30 hover:from-blue-500/30 hover:to-blue-600/30">
                  <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center mb-6">
                    <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                  </div>
                  <h3 className="text-white text-2xl font-semibold mb-4">Dynamic Content Generation</h3>
                  <p className="text-white/80 text-lg leading-relaxed">
                    Lotus can generate creative and informative content, from articles to summaries, tailored to your
                    needs.
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-400/30 hover:from-green-500/30 hover:to-green-600/30">
                  <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center mb-6">
                    <div className="w-6 h-6 bg-green-400 rounded-full"></div>
                  </div>
                  <h3 className="text-white text-2xl font-semibold mb-4">Contextual Understanding & Refinement</h3>
                  <p className="text-white/80 text-lg leading-relaxed">
                    Lotus understands context deeply, allowing it to refine its responses and actions based on your
                    ongoing conversation.
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-400/30 hover:from-purple-500/30 hover:to-purple-600/30">
                  <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center mb-6">
                    <div className="w-6 h-6 bg-purple-400 rounded-full"></div>
                  </div>
                  <h3 className="text-white text-2xl font-semibold mb-4">Memory Mindmap Visualization</h3>
                  <p className="text-white/80 text-lg leading-relaxed">
                    Explore Lotus's understanding of your conversations through an interactive, visual mindmap of its
                    memory.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-32">
        {/* Warm gradient background for testimonials section */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/20 via-black to-gray-950/20"></div>
          <div className="absolute inset-0 bg-black/70"></div>
        </div>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className="text-white text-4xl lg:text-5xl font-light mb-6 tracking-tight">
                Trusted by Innovators Worldwide
              </h2>
              <div className="text-white/70 text-xl max-w-2xl mx-auto">
                <TextType
                  text={[
                    "Join a global community leveraging Lotus for cutting-edge AI solutions.",
                    "Hear how Lotus empowers individuals and teams to achieve more.",
                    "Discover why leading minds choose Lotus for their AI needs.",
                  ]}
                  typingSpeed={60}
                  pauseDuration={3000}
                  showCursor={false}
                  className="text-white/70"
                  variableSpeed={undefined}
                  onSentenceComplete={undefined}
                />
              </div>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 auto-rows-fr">
              {/* Testimonial 1 */}
              <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:scale-105 min-w-0">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    S
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold">Sarah Chen</h4>
                    <p className="text-white/60 text-sm">AI Researcher, TechCorp</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex space-x-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full opacity-90"></div>
                    ))}
                  </div>
                  <ScrambledText
                    className="text-white/90 text-base sm:text-lg leading-relaxed break-normal !m-0 !max-w-none !font-sans !text-base sm:!text-lg"
                    radius={60}
                    duration={0.8}
                    speed={0.4}
                    scrambleChars="★☆✦✧"
                  >
                    "Lotus's deep research capabilities are a game-changer. It synthesizes complex information faster than anything I've seen."
                  </ScrambledText>
                </div>
                <div className="text-white/40 text-sm group-hover:text-white/60 transition-colors">
                  Accelerated research by 70%
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:scale-105 lg:mt-8 min-w-0">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    M
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold">Marcus Rodriguez</h4>
                    <p className="text-white/60 text-sm">Lead Developer, StartupXYZ</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex space-x-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full opacity-90"></div>
                    ))}
                  </div>
                  <ScrambledText
                    className="text-white/90 text-base sm:text-lg leading-relaxed break-normal !m-0 !max-w-none !font-sans !text-base sm:!text-lg"
                    radius={60}
                    duration={0.8}
                    speed={0.4}
                    scrambleChars="★☆✦✧"
                  >
                    "The coding assistance from Lotus is phenomenal. It's like having an extra senior engineer on the team."
                  </ScrambledText>
                </div>
                <div className="text-white/40 text-sm group-hover:text-white/60 transition-colors">
                  Increased coding efficiency by 120%
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:scale-105 lg:mt-16 min-w-0">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    A
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold">Aisha Patel</h4>
                    <p className="text-white/60 text-sm">Product Strategist, ScaleUp</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex space-x-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full opacity-90"></div>
                    ))}
                  </div>
                  <ScrambledText
                    className="text-white/90 text-base sm:text-lg leading-relaxed break-normal !m-0 !max-w-none !font-sans !text-base sm:!text-lg"
                    radius={60}
                    duration={0.8}
                    speed={0.4}
                    scrambleChars="★☆✦✧"
                  >
                    "Lotus's planning and reasoning capabilities have streamlined our strategic decision-making process immensely."
                  </ScrambledText>
                </div>
                <div className="text-white/40 text-sm group-hover:text-white/60 transition-colors">
                  Improved decision-making speed by 90%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-16 sm:mt-20 pt-12 sm:pt-16 border-t border-white/10">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-light text-white mb-2">
                  <ShinyText text="10,000+" speed={4} className="text-white" />
                </div>
                <div className="text-white/60 text-sm sm:text-base">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-light text-white mb-2">
                  <ShinyText text="500+" speed={4} className="text-white" />
                </div>
                <div className="text-white/60 text-sm sm:text-base">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-light text-white mb-2">
                  <ShinyText text="99.9%" speed={4} className="text-white" />
                </div>
                <div className="text-white/60 text-sm sm:text-base">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-light text-white mb-2">
                  <ShinyText text="24/7" speed={4} className="text-white" />
                </div>
                <div className="text-white/60 text-sm sm:text-base">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-32">
        <div className="absolute inset-0 -z-20">
          <Dither
            waveColor={[0.4, 0.2, 0.5]}
            disableAnimation={false}
            enableMouseInteraction={true}
            mouseRadius={1.0}
            colorNum={8}
            waveAmplitude={0.5}
            waveFrequency={2}
            waveSpeed={0.02}
            pixelSize={4}
          />
        </div>
        {/* Smooth gradient transitions and blend overlays */}
        <div className="absolute inset-0 -z-10">
          {/* Top fade transition */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black via-black/80 to-transparent"></div>
          {/* Bottom fade transition */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
          {/* Main blend overlay */}
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-950/10 via-black/60 to-indigo-950/10"></div>
          {/* Additional smooth blend */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className="text-white text-4xl lg:text-5xl font-light mb-6 tracking-tight">
                Simple, Transparent Pricing
              </h2>
              <p className="text-white/70 text-xl max-w-2xl mx-auto mb-8">
                Choose the perfect plan for your team. Start free, scale as you grow.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center space-x-4 mb-12">
                <span className="text-white/70">Monthly</span>
                <button className="relative w-16 h-8 bg-white/20 rounded-full border border-white/30 transition-all duration-300 hover:bg-white/30">
                  <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 transform translate-x-0"></div>
                </button>
                <span className="text-white">
                  Annual <span className="text-green-400 text-sm font-medium">(Save 20%)</span>
                </span>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* Starter Plan */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="text-center mb-8">
                  <h3 className="text-white text-xl font-semibold mb-2">Starter</h3>
                  <p className="text-white/60 mb-6">Perfect for individuals exploring Lotus AI with basic features</p>
                  <div className="mb-4">
                    <span className="text-4xl font-light text-white">$0</span>
                    <span className="text-white/60">/month</span>
                  </div>
                  <Button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm transition-all duration-200">
                    Get Started Free
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Basic AI chat features
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Rate limited usage
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Limited web search
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    No deep research
                  </div>
                </div>
              </div>

              {/* Pro Plan - Featured */}
              <div className="bg-gradient-to-b from-blue-500/20 to-blue-600/20 backdrop-blur-sm border-2 border-blue-400/30 rounded-2xl p-8 hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 hover:-translate-y-2 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</div>
                </div>
                <div className="text-center mb-8">
                  <h3 className="text-white text-xl font-semibold mb-2">
                    <ShinyText text="Professional" speed={3} className="text-white" />
                  </h3>
                  <p className="text-white/60 mb-6">Unlock full capabilities with no limits</p>
                  <div className="mb-4">
                    <span className="text-4xl font-light text-white">$5</span>
                    <span className="text-white/60">/month</span>
                  </div>
                  <Button className="w-full bg-blue-500/90 hover:bg-blue-500 border border-blue-400/30 text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 px-6 text-sm sm:text-base w-full sm:w-auto">
                    Start Pro Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Unlimited AI capabilities
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Full learning & memory
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Deep research access
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Priority support
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    All future features included
                  </div>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="text-center mb-8">
                  <h3 className="text-white text-xl font-semibold mb-2">Enterprise</h3>
                  <p className="text-white/60 mb-6">For large organizations with custom AI needs</p>
                  <div className="mb-4">
                    <div className="text-white/80 text-lg">
                      <TextType
                        text={["Custom Pricing", "Contact Sales", "Let's Talk"]}
                        typingSpeed={100}
                        pauseDuration={2000}
                        showCursor={false}
                        className="text-white text-2xl font-light"
                        variableSpeed={undefined}
                        onSentenceComplete={undefined}
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm transition-all duration-200"
                  >
                    Contact Sales
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    All Pro features
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Dedicated AI models
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    On-premise deployment options
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    24/7 enterprise support
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Custom integrations & APIs
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-20 pt-16 border-t border-white/10">
              <h3 className="text-white text-2xl font-light text-center mb-12">Frequently Asked Questions</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">Can I change plans anytime?</h4>
                  <ScrambledText
                    className="text-white/80 text-sm leading-relaxed"
                    radius={50}
                    duration={0.6}
                    speed={0.3}
                    scrambleChars="?!."
                  >
                    Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                  </ScrambledText>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h4 className="text-white font-semibold mb-3">Is there a free trial?</h4>
                  <ScrambledText
                    className="text-white/80 text-sm leading-relaxed"
                    radius={50}
                    duration={0.6}
                    speed={0.3}
                    scrambleChars="?!."
                  >
                    All paid plans come with a 14-day free trial. No credit card required to start.
                  </ScrambledText>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="relative z-10 py-16 sm:py-20 border-t border-white/10">
        {/* Subtle gradient background for footer */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/50 via-black to-black"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
              {/* Company Info */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 mr-3">
                    <img src="/lotus.svg" alt="Lotus" className="w-full h-full opacity-80" />
                  </div>
                  <span className="text-white font-semibold text-xl">Lotus</span>
                </div>
                <div className="text-white/70 text-sm leading-relaxed mb-6">
                  <TextType
                    text={[
                      "Your AI chat that learns, plans, researches, reasons, and codes.",
                      "Experience the future of intelligent assistance with Lotus.",
                      "Lotus: AI that evolves with you.",
                    ]}
                    typingSpeed={60}
                    pauseDuration={3000}
                    showCursor={false}
                    className="text-white/70"
                    variableSpeed={undefined}
                    onSentenceComplete={undefined}
                  />
                </div>
                {/* Social Links */}
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="w-5 h-5 bg-white/70 rounded-full"></div>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="w-5 h-5 bg-white/70 rounded-full"></div>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="w-5 h-5 bg-white/70 rounded-full"></div>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div className="w-5 h-5 bg-white/70 rounded-full"></div>
                  </a>
                </div>
              </div>

              {/* Product Links */}
              <div>
                <h4 className="text-white font-semibold mb-4 sm:mb-6">
                  <ShinyText text="Product" speed={4} className="text-white" />
                </h4>
                <ul className="space-y-3 sm:space-y-4">
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Templates
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Integrations
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      API
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Changelog
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h4 className="text-white font-semibold mb-4 sm:mb-6">Company</h4>
                <ul className="space-y-3 sm:space-y-4">
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Press
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Partners
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support Links */}
              <div>
                <h4 className="text-white font-semibold mb-4 sm:mb-6">Support</h4>
                <ul className="space-y-3 sm:space-y-4">
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Community
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                      Status
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12">
              <div className="max-w-2xl mx-auto text-center">
                <h3 className="text-white text-lg sm:text-xl font-semibold mb-4">Stay in the Flow</h3>
                <p className="text-white/70 mb-6 text-sm sm:text-base">
                  Get the latest updates, tips, and insights delivered to your inbox.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm text-sm sm:text-base"
                  />
                  <Button className="bg-blue-500/90 hover:bg-blue-500 border border-blue-400/30 text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 px-6 text-sm sm:text-base w-full sm:w-auto">
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-6 sm:pt-8 border-t border-white/10">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 text-center sm:text-left">
                <div className="text-white/60 text-xs sm:text-sm order-2 sm:order-1 min-w-0 flex-shrink-0">
                  <ScrambledText
                    className="text-white/60 whitespace-nowrap"
                    radius={30}
                    duration={0.5}
                    speed={0.2}
                    scrambleChars="©®™"
                  >
                    © 2024 Lotus. All rights reserved.
                  </ScrambledText>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 order-1 sm:order-2">
                  <a
                    href="#"
                    className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors duration-200 whitespace-nowrap"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors duration-200 whitespace-nowrap"
                  >
                    Terms of Service
                  </a>
                  <a
                    href="#"
                    className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors duration-200 whitespace-nowrap"
                  >
                    Cookie Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}