"use client"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"
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

        <div className="relative z-20 container mx-auto px-4 lg:px-8 grid lg:grid-cols-[2fr_1fr] gap-8 lg:gap-16 items-center">
          {/* Left Column - Hero Content */}
          <div className="max-w-5xl mx-auto lg:mx-0 text-center lg:text-left">
            {/* Clean, Powerful Headline */}
            <div className="mb-14">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-8">
                Stop Paying <span className="text-gray-400 line-through opacity-60">$20</span> 
                <br className="hidden md:block" />
                for AI That <span className="text-purple-300">Spies on You</span>
              </h1>
              <p className="text-2xl md:text-3xl text-purple-100 font-medium leading-relaxed max-w-3xl">
                Get ChatGPT-level AI for <span className="text-white font-bold bg-purple-500/20 px-2 py-1 rounded-md">$5/month</span> 
                <br className="hidden lg:block" />
                <span className="text-purple-200">with zero data harvesting</span>
              </p>
            </div>

            {/* Clean Benefits */}
            <div className="space-y-8 mb-12">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-lg text-white/90 leading-relaxed">
                    <span className="font-semibold">Same powerful reasoning</span> as $20 competitors
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-lg text-white/90 leading-relaxed">
                    <span className="font-semibold">Remembers your conversations</span> forever
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-lg text-white/90 leading-relaxed">
                    <span className="font-semibold">Never trains on your private data</span>
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-lg text-white/90 leading-relaxed">
                    <span className="font-semibold text-purple-200">Save $180/year</span> vs ChatGPT Plus
                  </p>
                </div>
              </div>
              
              <p className="text-xl text-white/85 leading-relaxed max-w-2xl font-medium">
                While OpenAI, Google & Anthropic mine your conversations, 
                <span className="text-purple-200 font-bold"> Lotus gives you the same AI power without the privacy invasion.</span>
              </p>

              <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg px-4 py-3 inline-block">
                <p className="text-purple-200 text-base font-medium">
                  💜 <span className="text-purple-100 font-semibold">2,847 users</span> switched from $20 AI subscriptions last month
                </p>
              </div>
            </div>

            {/* Streamlined CTA */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-700 hover:to-violet-600 text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-105 px-10 py-5 text-xl font-bold shadow-2xl shadow-purple-500/30 rounded-xl"
                >
                  Start Free Trial - Save $180/Year
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
                
                <p className="text-center lg:text-left text-purple-200/80 text-sm font-medium">
                  No credit card required • Full access for 14 days
                </p>
              </div>
              
              <div className="flex items-center justify-center lg:justify-start space-x-8 text-sm text-white/60">
                <span className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  <span>14-day free trial</span>
                </span>
                <span className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  <span>Cancel anytime</span>
                </span>
                <span className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  <span>No setup fees</span>
                </span>
              </div>
            </div>
          </div>

          <div className="relative h-[400px] sm:h-[500px] lg:h-[700px] mt-8 lg:mt-0">
            <ParticleBackground className="opacity-70 sm:opacity-80 lg:opacity-90 max-h-[70vh]" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-8 sm:py-12 lg:py-16">
        {/* Dark gradient background for features section */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-gray-900/50 to-black"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-6 leading-tight">
                <ShinyText text="Intelligence Without Surveillance" speed={3} className="text-white" />
              </h2>
              <div className="max-w-2xl mx-auto">
                <TextType
                  text={[
                    "AI that learns you—not sells you.",
                    "Your thoughts stay yours. Your data stays private.",
                    "Experience AI that gets smarter with you, not from you.",
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

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 auto-rows-fr">
              {/* Card 1 - Large */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 md:col-span-2 lg:col-span-2">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-purple-400 rounded-full"></div>
                </div>
                <h3 className="text-white text-xl lg:text-2xl font-semibold mb-4">Privacy-First by Design</h3>
                <p className="text-white/70 leading-relaxed text-base lg:text-lg">
                  We never train on your data. We don't sell it. We don't even keep it. Your conversations stay yours, protected by end-to-end encryption and zero-knowledge architecture.
                </p>
              </div>

              {/* Card 2 - Small */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-violet-400 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">Persistent Memory</h3>
                <p className="text-white/70 leading-relaxed text-sm lg:text-base">
                  Unlike other AIs that forget you after 5 minutes, Lotus remembers your style, goals, and voice.
                </p>
              </div>

              {/* Card 3 - Small */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-indigo-400 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">Performance Without Price Gouging</h3>
                <p className="text-white/70 leading-relaxed text-sm lg:text-base">
                  Same reasoning depth. Same research power. One-fourth the cost of ChatGPT, Claude, or Gemini.
                </p>
              </div>

              {/* Card 4 - Large */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 md:col-span-2 lg:col-span-2">
                <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                </div>
                <h3 className="text-white text-xl lg:text-2xl font-semibold mb-4">Adapts to You, Not the Market</h3>
                <p className="text-white/70 leading-relaxed text-base lg:text-lg">
                  Your Lotus learns your writing style, preferences, and goals. It evolves with you—not from analyzing millions of other users. Every interaction makes it more uniquely yours.
                </p>
              </div>

              {/* Card 5 - Small */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-violet-500 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">Research & Code</h3>
                <p className="text-white/70 leading-relaxed text-sm lg:text-base">
                  Deep research, intelligent planning, and powerful coding capabilities. No data harvesting, no corporate surveillance.
                </p>
              </div>

              {/* Card 6 - Small */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-indigo-500 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">Data Sovereignty</h3>
                <p className="text-white/70 leading-relaxed text-sm lg:text-base">
                  Your thoughts. Your research. Your memories. Yours—forever. We don't train on them, sell them, or keep them.
                </p>
              </div>

              {/* Card 7 - Small */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg lg:text-xl font-semibold mb-4">Always Available</h3>
                <p className="text-white/70 leading-relaxed text-sm lg:text-base">
                  24/7 uptime with global infrastructure. Your AI assistant is ready whenever inspiration strikes.
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
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-white text-4xl lg:text-5xl font-light mb-6 tracking-tight">
                The AI Price War Ends Here
              </h2>
              <p className="text-white/70 text-xl max-w-3xl mx-auto mb-8">
                Why pay $20/month for AI that watches you? Get the same intelligence, better privacy, and 75% savings.
              </p>
            </div>

            {/* Comparison Cards Layout */}
            <div className="space-y-8">
              {/* Header Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Lotus Card - Featured */}
                <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 backdrop-blur-xl border-2 border-purple-400/30 rounded-2xl p-6 relative order-first lg:order-2">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-500 to-violet-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      BEST VALUE
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <div className="flex justify-center mb-3">
                      <img 
                        src="/lotus-full.svg" 
                        alt="Lotus" 
                        className="h-8 w-auto opacity-90 filter brightness-0 invert"
                      />
                    </div>
                    <div className="text-purple-300 text-4xl font-black">$5</div>
                    <div className="text-white/60 text-sm">/month</div>
                    <div className="text-purple-200 text-sm font-medium mt-1">Save $180/year</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-white/90">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="text-sm">Never trains on your data</span>
                    </div>
                    <div className="flex items-center text-white/90">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="text-sm">Persistent personal memory</span>
                    </div>
                    <div className="flex items-center text-white/90">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="text-sm">Latest AI models</span>
                    </div>
                    <div className="flex items-center text-white/90">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="text-sm">Code, Research, Analysis</span>
                    </div>
                    <div className="flex items-center text-white/90">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="text-sm">Generous usage limits</span>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25">
                    Start Saving Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {/* ChatGPT Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 order-2 lg:order-3">
                  <div className="text-center mb-4">
                    <h3 className="text-white font-semibold text-lg mb-2">ChatGPT Plus</h3>
                    <div className="text-gray-400 text-3xl font-bold line-through opacity-75">$20</div>
                    <div className="text-white/60 text-sm">/month</div>
                    <div className="text-gray-300 text-sm mt-1">$240/year</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
                      <span className="text-sm">Trains on your data by default</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-sm">Limited session memory</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
                      <span className="text-sm">GPT-4o, o3-mini</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
                      <span className="text-sm">Code, Research, Images</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-sm">80 msgs/3hrs GPT-4o</span>
                    </div>
                  </div>
                </div>

                {/* Claude Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 order-3 lg:order-4">
                  <div className="text-center mb-4">
                    <h3 className="text-white font-semibold text-lg mb-2">Claude Pro</h3>
                    <div className="text-gray-400 text-3xl font-bold line-through opacity-75">$20</div>
                    <div className="text-white/60 text-sm">/month</div>
                    <div className="text-gray-300 text-sm mt-1">$240/year</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
                      <span className="text-sm">Trains on your data by default</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-sm">Limited session memory</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
                      <span className="text-sm">Claude 4 models</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
                      <span className="text-sm">Code, Research, Web</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-sm">40-80 hrs/week</span>
                    </div>
                  </div>
                </div>

                {/* Gemini Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 order-4 lg:order-5">
                  <div className="text-center mb-4">
                    <h3 className="text-white font-semibold text-lg mb-2">Gemini Advanced</h3>
                    <div className="text-gray-400 text-3xl font-bold line-through opacity-75">$20</div>
                    <div className="text-white/60 text-sm">/month</div>
                    <div className="text-gray-300 text-sm mt-1">$240/year</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
                      <span className="text-sm">Trains on your data by default</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-sm">Limited session memory</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
                      <span className="text-sm">Gemini 2.5 Pro</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
                      <span className="text-sm">Code, Research, Video</span>
                    </div>
                    <div className="flex items-center text-white/70">
                      <div className="w-2 h-2 bg-violet-400 rounded-full mr-3"></div>
                      <span className="text-sm">1M token context</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <h3 className="text-white text-2xl font-bold mb-4">The Choice is Clear</h3>
                <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
                  Get the same AI power as ChatGPT, Claude, and Gemini—but with true privacy and 75% cost savings
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="text-center">
                    <div className="text-purple-300 text-3xl font-black">$5/month</div>
                    <div className="text-purple-200 text-sm">vs $20 competitors</div>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25">
                    Join Lotus Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
                <p className="text-purple-300 text-sm mt-4 font-medium">✓ 14-day free trial • No contract • Cancel anytime</p>
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
                  <img src="/lotus-full.svg" alt="Lotus" className="h-8 w-auto opacity-80 filter brightness-0 invert" />
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
              <Link href="/pricing" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                Features
              </Link>
                  </li>
                  <li>
              <Link href="/pricing" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
                Pricing
              </Link>
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
