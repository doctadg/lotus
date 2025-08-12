"use client"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import TextType from "@/components/TextType"
import ShinyText from "@/components/ShinyText"
import ScrambledText from "@/components/ScrambledText"
import ScrollStack, { ScrollStackItem } from "@/components/ScrollStack"
import ParticleBackground from "@/components/ParticleBackground"
import DarkVeil from "@/components/DarkVeil"
import DynamicNavbar from "@/components/DynamicNavbar"
import Threads from "@/components/Threads"
import Dither from "@/components/Dither"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Dynamic Navbar */}
      <DynamicNavbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <DarkVeil />
        </div>

        {/* Background gradient effects */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5"
            style={{
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

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
              Build internal tools that actually flow
            </h1>

            {/* Supporting Text */}
            <p
              className="text-white/80 mb-8 max-w-xl mx-auto lg:mx-0"
              style={{
                fontSize: "clamp(1rem, 3vw, 1.25rem)",
                lineHeight: "1.6",
              }}
            >
              FlowBuilder lets teams design lightweight internal apps and workflows with zero friction. Fast to launch.
              Easy to evolve. Built to feel invisible.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                size="lg"
                className="bg-blue-500/90 hover:bg-blue-500 border border-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 px-6 sm:px-8 py-3 text-sm sm:text-base font-medium w-full sm:w-auto"
              >
                Try FlowBuilder Free
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
            <ParticleBackground className="opacity-70 sm:opacity-80 lg:opacity-90" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 sm:py-40 lg:py-56">
        <div className="absolute -inset-y-32 inset-x-0 -z-20">
          <Threads amplitude={1} distance={0} enableMouseInteraction={true} color={[0.3, 0.4, 0.8]} />
        </div>
        {/* Dark gradient background for features section */}
        <div className="absolute -inset-y-32 inset-x-0 -z-10 bg-gradient-to-b from-black via-gray-900/50 to-black"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-6 leading-tight">
                <ShinyText text="Features that Flow" speed={3} className="text-white" />
              </h2>
              <div className="max-w-2xl mx-auto">
                <TextType
                  text={[
                    "Everything you need to build internal tools",
                    "Powerful features that scale with your team",
                    "Simple tools for complex workflows",
                  ]}
                  typingSpeed={75}
                  pauseDuration={2000}
                  showCursor={true}
                  cursorCharacter="|"
                  className="text-white/70 text-lg sm:text-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Feature 1 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg sm:text-xl font-semibold mb-4">Drag & Drop Builder</h3>
                <p className="text-white/70 leading-relaxed text-sm sm:text-base">
                  Create complex workflows with our intuitive visual builder. No coding required.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-green-400 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg sm:text-xl font-semibold mb-4">Real-time Collaboration</h3>
                <p className="text-white/70 leading-relaxed text-sm sm:text-base">
                  Work together seamlessly with your team in real-time, anywhere in the world.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-purple-400 rounded-full"></div>
                </div>
                <h3 className="text-white text-lg sm:text-xl font-semibold mb-4">Smart Integrations</h3>
                <p className="text-white/70 leading-relaxed text-sm sm:text-base">
                  Connect with 100+ tools and services to streamline your existing workflows.
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
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-black to-purple-950/20"></div>
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className="text-white text-4xl lg:text-5xl font-light mb-6 tracking-tight">Experience the Magic</h2>
              <p className="text-white/70 text-xl max-w-2xl mx-auto">
                Interact with our components to see the power of FlowBuilder in action
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Column - Interactive Text */}
              <div className="space-y-12">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                  <h3 className="text-white text-lg font-semibold mb-4">Hover to Scramble</h3>
                  <ScrambledText
                    className="text-white/90 text-base leading-relaxed"
                    radius={80}
                    duration={1.0}
                    speed={0.6}
                    scrambleChars=".:!@#$%"
                  >
                    Move your cursor over this text to see the scrambling effect in action. This demonstrates the kind
                    of interactive experiences you can build with FlowBuilder.
                  </ScrambledText>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                  <h3 className="text-white text-lg font-semibold mb-4">Dynamic Typing</h3>
                  <div className="text-white/90 text-lg">
                    <TextType
                      text={[
                        "Build internal tools that scale",
                        "Create workflows that adapt",
                        "Design experiences that delight",
                      ]}
                      typingSpeed={75}
                      pauseDuration={1500}
                      showCursor={true}
                      cursorCharacter="_"
                      className="text-white/90"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Scroll Stack Demo */}
              <div className="h-[600px] bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                <ScrollStack className="h-full">
                  <ScrollStackItem itemClassName="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/20">
                    <h3 className="text-white text-2xl font-semibold mb-4">Workflow Builder</h3>
                    <p className="text-white/80 text-lg leading-relaxed">
                      Design complex workflows with our intuitive drag-and-drop interface. Connect actions, set
                      conditions, and automate your processes.
                    </p>
                  </ScrollStackItem>

                  <ScrollStackItem itemClassName="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/20">
                    <h3 className="text-white text-2xl font-semibold mb-4">Data Integration</h3>
                    <p className="text-white/80 text-lg leading-relaxed">
                      Connect to any data source - databases, APIs, spreadsheets, and more. Transform and visualize your
                      data in real-time.
                    </p>
                  </ScrollStackItem>

                  <ScrollStackItem itemClassName="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-400/20">
                    <h3 className="text-white text-2xl font-semibold mb-4">Team Collaboration</h3>
                    <p className="text-white/80 text-lg leading-relaxed">
                      Share workflows, collaborate in real-time, and manage permissions. Keep your entire team aligned
                      and productive.
                    </p>
                  </ScrollStackItem>
                </ScrollStack>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-32">
        {/* Warm gradient background for testimonials section */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-950/20 via-black to-red-950/20"></div>
          <div className="absolute inset-0 bg-black/70"></div>
        </div>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-20">
              <h2 className="text-white text-4xl lg:text-5xl font-light mb-6 tracking-tight">
                Trusted by Teams Worldwide
              </h2>
              <p className="text-white/70 text-xl max-w-2xl mx-auto">
                <TextType
                  text={[
                    "Join thousands of teams building better workflows",
                    "See what our customers are saying about FlowBuilder",
                    "Discover why teams choose FlowBuilder for their tools",
                  ]}
                  typingSpeed={60}
                  pauseDuration={3000}
                  showCursor={false}
                  className="text-white/70"
                />
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Testimonial 1 */}
              <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:scale-105">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    S
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold">Sarah Chen</h4>
                    <p className="text-white/60 text-sm">Product Manager, TechCorp</p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full opacity-90"></div>
                    ))}
                  </div>
                  <ScrambledText
                    className="text-white/90 text-sm sm:text-base leading-relaxed break-words"
                    radius={60}
                    duration={0.8}
                    speed={0.4}
                    scrambleChars="★☆✦✧"
                  >
                    "FlowBuilder transformed how our team builds internal tools. What used to take weeks now takes
                    hours."
                  </ScrambledText>
                </div>
                <div className="text-white/40 text-sm group-hover:text-white/60 transition-colors">
                  Reduced development time by 80%
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:scale-105 lg:mt-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    M
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold">Marcus Rodriguez</h4>
                    <p className="text-white/60 text-sm">CTO, StartupXYZ</p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full opacity-90"></div>
                    ))}
                  </div>
                  <ScrambledText
                    className="text-white/90 text-sm sm:text-base leading-relaxed break-words"
                    radius={60}
                    duration={0.8}
                    speed={0.4}
                    scrambleChars="★☆✦✧"
                  >
                    "The drag-and-drop interface is incredibly intuitive. Our non-technical team members love it."
                  </ScrambledText>
                </div>
                <div className="text-white/40 text-sm group-hover:text-white/60 transition-colors">
                  Increased team productivity by 150%
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 hover:scale-105 lg:mt-16">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    A
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold">Aisha Patel</h4>
                    <p className="text-white/60 text-sm">Operations Lead, ScaleUp</p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full opacity-90"></div>
                    ))}
                  </div>
                  <ScrambledText
                    className="text-white/90 text-sm sm:text-base leading-relaxed break-words"
                    radius={60}
                    duration={0.8}
                    speed={0.4}
                    scrambleChars="★☆✦✧"
                  >
                    "FlowBuilder's integrations saved us countless hours. Everything just works together seamlessly."
                  </ScrambledText>
                </div>
                <div className="text-white/40 text-sm group-hover:text-white/60 transition-colors">
                  Connected 15+ tools in one workflow
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
            waveColor={[0.5, 0.5, 0.5]}
            disableAnimation={false}
            enableMouseInteraction={true}
            mouseRadius={0.3}
            colorNum={4}
            waveAmplitude={0.3}
            waveFrequency={3}
            waveSpeed={0.05}
            pixelSize={200}
          />
        </div>
        {/* Premium gradient background for pricing section */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-950/30 via-black to-indigo-950/30"></div>
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
                  <p className="text-white/60 mb-6">Perfect for small teams getting started</p>
                  <div className="mb-6">
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
                    Up to 3 workflows
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    5 team members
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Basic integrations
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Community support
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
                  <p className="text-white/60 mb-6">For growing teams that need more power</p>
                  <div className="mb-6">
                    <span className="text-4xl font-light text-white">$29</span>
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
                    Unlimited workflows
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    25 team members
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Advanced integrations
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
                    Custom templates
                  </div>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
                <div className="text-center mb-8">
                  <h3 className="text-white text-xl font-semibold mb-2">Enterprise</h3>
                  <p className="text-white/60 mb-6">For large organizations with custom needs</p>
                  <div className="mb-6">
                    <div className="text-white/80 text-lg">
                      <TextType
                        text={["Custom Pricing", "Contact Sales", "Let's Talk"]}
                        typingSpeed={100}
                        pauseDuration={2000}
                        showCursor={false}
                        className="text-white text-2xl font-light"
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
                    Everything in Pro
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Unlimited team members
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Custom integrations
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Dedicated support
                  </div>
                  <div className="flex items-center text-white/80">
                    <div className="w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center mr-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    SLA guarantee
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
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 mr-3">
                    <img src="/lotus.svg" alt="FlowBuilder" className="w-full h-full opacity-80" />
                  </div>
                  <span className="text-white font-semibold text-xl">FlowBuilder</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  <TextType
                    text={[
                      "Build internal tools that actually flow",
                      "Design workflows that scale with your team",
                      "Create experiences that feel invisible",
                    ]}
                    typingSpeed={60}
                    pauseDuration={3000}
                    showCursor={false}
                    className="text-white/70"
                  />
                </p>
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
                    © 2024 FlowBuilder. All rights reserved.
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
