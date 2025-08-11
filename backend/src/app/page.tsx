'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [stats, setStats] = useState({ users: 0, messages: 0, uptime: 0, countries: 0 })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Animate counters on mount only
  useEffect(() => {
    if (!mounted) return

    const targets = { users: 25000, messages: 5200000, uptime: 99.9, countries: 47 }
    const duration = 2000
    const steps = 60
    const increment = duration / steps

    const current = { users: 0, messages: 0, uptime: 0, countries: 0 }
    
    const timer = setInterval(() => {
      Object.keys(targets).forEach(key => {
        const target = targets[key as keyof typeof targets]
        const step = target / steps
        if (current[key as keyof typeof current] < target) {
          current[key as keyof typeof current] = Math.min(current[key as keyof typeof current] + step, target)
        }
      })
      
      setStats({...current})
      
      if (Object.values(current).every((val, idx) => val >= Object.values(targets)[idx])) {
        clearInterval(timer)
      }
    }, increment)

    return () => clearInterval(timer)
  }, [mounted])

  // Define testimonials first
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager at TechCorp",
      avatar: "SC",
      content: "Lotus has completely transformed how our team approaches AI assistance. The contextual memory is game-changing - it actually remembers our project details and coding preferences across sessions.",
      rating: 5,
      company: "TechCorp"
    },
    {
      name: "Marcus Rodriguez",
      role: "Senior Developer",
      avatar: "MR", 
      content: "The real-time streaming makes conversations feel incredibly natural. It's like pair programming with the smartest developer on the team. The response quality is consistently excellent.",
      rating: 5,
      company: "StartupXYZ"
    },
    {
      name: "Dr. Emily Watson",
      role: "Research Scientist",
      avatar: "EW",
      content: "I use Lotus daily for research assistance and data analysis. The privacy-first approach gives me confidence when working with sensitive research data. Absolutely indispensable.",
      rating: 5,
      company: "Research Institute"
    },
    {
      name: "Alex Kim",
      role: "Creative Director", 
      avatar: "AK",
      content: "From brainstorming to execution, Lotus helps at every stage of the creative process. The different AI agents are perfectly tailored for different types of creative work.",
      rating: 5,
      company: "Creative Agency"
    },
    {
      name: "David Park",
      role: "Startup Founder",
      avatar: "DP",
      content: "Lotus has been instrumental in scaling our startup. From technical decisions to market research, it's like having a brilliant consultant available 24/7.",
      rating: 5,
      company: "InnovateNow"
    }
  ]

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  if (!mounted) return null

  const features = [
    {
      icon: "⚡",
      title: "Real-time Streaming",
      description: "Watch responses appear in real-time as AI processes your queries. No more waiting - just instant, fluid conversations.",
      details: "Advanced streaming technology delivers responses token by token, creating the most natural AI conversation experience available."
    },
    {
      icon: "🧠",
      title: "Contextual Memory",
      description: "AI that remembers your preferences, conversation history, and adapts to your unique communication style over time.",
      details: "Sophisticated memory architecture maintains context across sessions, learning your preferences and becoming more helpful with every interaction."
    },
    {
      icon: "🔒",
      title: "Privacy First",
      description: "Enterprise-grade security with end-to-end encryption. Your data stays private and secure, always.",
      details: "Zero-knowledge architecture ensures your conversations remain private. We can't read your data even if we wanted to."
    },
    {
      icon: "🚀",
      title: "Lightning Performance",
      description: "Optimized for speed with sub-second response times and 99.9% uptime reliability.",
      details: "Built on cutting-edge infrastructure with global CDN, ensuring fast responses no matter where you are in the world."
    },
    {
      icon: "🎯",
      title: "Intelligent Agents",
      description: "Specialized AI agents for different tasks - from coding to creative writing to data analysis.",
      details: "Choose from multiple AI personalities and specializations, each trained for specific use cases and domains."
    },
    {
      icon: "📱",
      title: "Multi-Platform",
      description: "Seamless experience across web, mobile, and desktop. Start on one device, continue on another.",
      details: "Full synchronization across all platforms with native apps for iOS, Android, Windows, and macOS."
    }
  ]

  const faqs = [
    {
      question: "How does Lotus AI differ from other AI assistants?",
      answer: "Lotus combines real-time streaming responses with advanced contextual memory, creating the most natural AI conversation experience available. Unlike other assistants, Lotus remembers your preferences and conversation history across sessions while maintaining complete privacy."
    },
    {
      question: "Is my data secure and private?",
      answer: "Absolutely. Lotus uses enterprise-grade security with end-to-end encryption and a zero-knowledge architecture. We cannot read your conversations even if we wanted to. Your data is yours alone and never used for training or shared with third parties."
    },
    {
      question: "Can I use Lotus for my business?",
      answer: "Yes! Lotus offers enterprise plans with team collaboration features, advanced security controls, custom AI agents, and dedicated support. Contact our sales team to discuss your specific needs."
    },
    {
      question: "What makes the real-time streaming special?",
      answer: "Our advanced streaming technology delivers AI responses token by token as they're generated, creating fluid, natural conversations. You see the AI 'thinking' in real-time, making interactions feel more human and engaging."
    },
    {
      question: "How does the contextual memory work?",
      answer: "Lotus maintains sophisticated memory of your conversations, preferences, and working style. It learns your communication patterns, remembers project details, and becomes more helpful over time while keeping everything completely private."
    },
    {
      question: "Is there a free version available?",
      answer: "Yes! We offer a generous free tier that includes real-time streaming, basic memory features, and access to our core AI models. Upgrade to Pro for unlimited usage, advanced features, and priority support."
    }
  ]

  const pricingPlans = [
    {
      name: "Free",
      price: "0",
      period: "forever",
      description: "Perfect for trying out Lotus",
      features: [
        "100 messages per month",
        "Real-time streaming",
        "Basic memory",
        "Web access",
        "Community support"
      ],
      buttonText: "Get Started",
      buttonVariant: "secondary",
      popular: false
    },
    {
      name: "Pro",
      price: "20",
      period: "month",
      description: "For power users and professionals",
      features: [
        "Unlimited messages",
        "Advanced memory system",
        "All AI agents",
        "Multi-platform access",
        "Priority support",
        "Custom agents",
        "Export conversations"
      ],
      buttonText: "Start Pro Trial",
      buttonVariant: "primary",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For teams and organizations",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "Admin dashboard",
        "SSO integration",
        "Advanced security",
        "Custom deployment",
        "Dedicated support"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "secondary",
      popular: false
    }
  ]

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://lotus-ai.com/#organization",
        "name": "Lotus AI",
        "url": "https://lotus-ai.com/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://lotus-ai.com/lotus-white.png",
          "width": 512,
          "height": 512
        },
        "description": "Intelligent AI chat assistant with real-time streaming and contextual understanding"
      },
      {
        "@type": "SoftwareApplication",
        "name": "Lotus AI Chat Assistant",
        "description": "Advanced AI chat assistant with real-time streaming, contextual memory, and privacy-first design",
        "applicationCategory": "AI Assistant",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating", 
          "ratingValue": "4.9",
          "reviewCount": "1247"
        }
      }
    ]
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      {/* Animated background */}
      <div className="hero-bg" style={{height: '100vh'}}></div>
      
      <div className="bg-background text-text-primary">
        {/* Navigation */}
        <nav role="navigation" aria-label="Main navigation" className="fixed top-0 w-full z-50 glass backdrop-blur-lg">
          <div className="container px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img 
                src="/lotus-white.png" 
                alt="Lotus AI Logo" 
                className="h-8 w-auto animate-float"
                width={32}
                height={32}
              />
              <span className="text-xl font-bold">Lotus AI</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Features</Link>
              <Link href="#demo" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Demo</Link>
              <Link href="#pricing" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Pricing</Link>
              <Link href="#faq" className="text-sm text-text-secondary hover:text-text-primary transition-colors">FAQ</Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="btn-primary text-sm px-4 py-2"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main>
          <section className="h-screen flex items-center justify-center relative overflow-hidden pt-20 pb-20">
            <div className="container px-6 text-center relative z-10">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse-glow"></div>
                <span className="text-sm text-text-secondary">🚀 Now with Advanced AI Agents • Real-time Streaming</span>
              </div>
              
              <h1 id="hero-heading" className="text-6xl md:text-8xl font-bold mb-8 leading-tight animate-slide-up">
                The AI Assistant
                <br />
                <span className="gradient-hero-text">
                  That Actually Gets You
                </span>
              </h1>
              
              <p className="text-2xl text-text-secondary max-w-4xl mx-auto mb-12 leading-relaxed animate-slide-up" style={{animationDelay: '0.1s'}}>
                Experience conversations that feel genuinely intelligent. Lotus remembers your context, 
                streams responses in real-time, and adapts to your unique style—all while keeping your data completely private.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16 animate-slide-up" style={{animationDelay: '0.2s'}}>
                <Link 
                  href="/register" 
                  className="btn-primary text-xl px-10 py-5 font-semibold w-full sm:w-auto group"
                >
                  Start Free Now 
                  <svg className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <button 
                  className="btn-secondary text-xl px-10 py-5 font-semibold w-full sm:w-auto group"
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <svg className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-text-tertiary animate-slide-up" style={{animationDelay: '0.3s'}}>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Free forever plan
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  No credit card needed
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Privacy guaranteed
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-accent-primary/10 rounded-full animate-float" style={{animationDelay: '0s'}}></div>
            <div className="absolute top-40 right-10 w-16 h-16 bg-blue-500/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-40 left-20 w-12 h-12 bg-pink-500/10 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-500/10 rounded-full animate-float" style={{animationDelay: '0.5s'}}></div>
          </section>
        </main>

        {/* Stats Section */}
        <section className="section-padding bg-background relative z-10">
          <div className="container">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-5xl font-bold gradient-text">
                  {Math.floor(stats.users).toLocaleString()}+
                </div>
                <div className="text-text-secondary font-medium">Happy Users</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold gradient-text">
                  {(stats.messages / 1000000).toFixed(1)}M+
                </div>
                <div className="text-text-secondary font-medium">Messages Processed</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold gradient-text">
                  {stats.uptime.toFixed(1)}%
                </div>
                <div className="text-text-secondary font-medium">Uptime</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold gradient-text">
                  {Math.floor(stats.countries)}+
                </div>
                <div className="text-text-secondary font-medium">Countries</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="section-padding">
          <div className="container">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold mb-6 gradient-text">Powerful Features</h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Discover what makes Lotus the most advanced AI assistant available today
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 mb-20">
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className={`feature-card cursor-pointer transition-all duration-300 ${
                      activeFeature === index ? 'ring-2 ring-accent-primary bg-surface-hover' : ''
                    }`}
                    onClick={() => setActiveFeature(index)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{feature.icon}</div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-text-secondary">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="card card-lg">
                <div className="text-4xl mb-6">{features[activeFeature].icon}</div>
                <h3 className="text-2xl font-bold mb-4">{features[activeFeature].title}</h3>
                <p className="text-text-secondary text-lg leading-relaxed">
                  {features[activeFeature].details}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="section-padding bg-surface-elevated">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">See Lotus in Action</h2>
              <p className="text-xl text-text-secondary">Experience the magic of real-time AI conversations</p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="card card-lg">
                <div className="bg-surface-elevated rounded-xl p-6 space-y-4">
                  {/* Mock chat interface */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center text-white text-sm font-semibold">
                      You
                    </div>
                    <div className="bg-accent-primary/20 rounded-lg px-4 py-2 max-w-md">
                      <p className="text-text-primary">Help me write a Python function to analyze sales data</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">L</span>
                    </div>
                    <div className="bg-surface rounded-lg px-4 py-2 flex-1">
                      <div className="text-text-primary space-y-2">
                        <p>I'd be happy to help you create a Python function for sales data analysis! Here's a comprehensive solution:</p>
                        <pre className="bg-background p-3 rounded text-sm overflow-x-auto">
                          <code>{`def analyze_sales_data(data):
    """Analyze sales data and return key metrics"""
    total_revenue = sum(data['revenue'])
    avg_order_value = total_revenue / len(data)
    
    return {
        'total_revenue': total_revenue,
        'avg_order_value': avg_order_value,
        'total_orders': len(data)
    }`}</code>
                        </pre>
                        <p className="text-text-secondary text-sm">This function calculates key sales metrics. Would you like me to add more specific analytics or explain any part?</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-text-tertiary">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm">Lotus is typing...</span>
                  </div>
                </div>
                
                <div className="text-center mt-6">
                  <Link 
                    href="/register" 
                    className="btn-primary px-8 py-3 font-semibold inline-flex items-center gap-2"
                  >
                    Try It Yourself
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="section-padding">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Loved by Professionals Worldwide</h2>
              <p className="text-xl text-text-secondary">See what our users are saying about Lotus</p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="card card-lg text-center">
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                
                <blockquote className="text-xl leading-relaxed mb-8 text-text-primary">
                  "{testimonials[activeTestimonial].content}"
                </blockquote>
                
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-accent-primary flex items-center justify-center text-white font-semibold">
                    {testimonials[activeTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-text-primary">{testimonials[activeTestimonial].name}</div>
                    <div className="text-text-secondary">{testimonials[activeTestimonial].role}</div>
                    <div className="text-text-tertiary text-sm">{testimonials[activeTestimonial].company}</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all ${
                        activeTestimonial === index ? 'bg-accent-primary' : 'bg-border hover:bg-accent-primary/50'
                      }`}
                      onClick={() => setActiveTestimonial(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="section-padding bg-surface-elevated">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-text-secondary">Choose the plan that works for you</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <div 
                  key={index}
                  className={`feature-card relative ${
                    plan.popular ? 'ring-2 ring-accent-primary scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-accent-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      {plan.price !== "Custom" && <span className="text-text-secondary">/{plan.period}</span>}
                    </div>
                    <p className="text-text-secondary mb-6">{plan.description}</p>
                    
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link 
                      href={plan.name === "Enterprise" ? "/contact" : "/register"}
                      className={`w-full ${
                        plan.buttonVariant === 'primary' ? 'btn-primary' : 'btn-secondary'
                      } py-3 px-6 font-semibold`}
                    >
                      {plan.buttonText}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="section-padding">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-text-secondary">Everything you need to know about Lotus</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="card">
                  <button
                    className="w-full p-6 text-left flex items-center justify-between"
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  >
                    <h3 className="text-lg font-semibold">{faq.question}</h3>
                    <svg 
                      className={`w-5 h-5 transition-transform ${
                        activeFaq === index ? 'rotate-180' : ''
                      }`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {activeFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="section-padding bg-surface-elevated">
          <div className="container">
            <div className="card card-xl text-center">
              <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
              <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
                Get the latest updates, tips, and exclusive features delivered to your inbox
              </p>
              
              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent-primary outline-none"
                />
                <button 
                  type="submit"
                  className="btn-primary px-6 py-3 font-semibold"
                >
                  Subscribe
                </button>
              </form>
              
              <p className="text-sm text-text-tertiary mt-4">
                No spam, unsubscribe at any time. We respect your privacy.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="section-padding">
          <div className="container text-center">
            <h2 className="text-5xl font-bold mb-6">
              Ready to Transform Your AI Experience?
            </h2>
            <p className="text-2xl text-text-secondary mb-12 max-w-3xl mx-auto">
              Join thousands of professionals who trust Lotus for their most important conversations.
              Start your journey today with our generous free plan.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
              <Link 
                href="/register" 
                className="btn-primary text-xl px-12 py-5 font-semibold w-full sm:w-auto group"
              >
                Start Free Now
                <svg className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                href="/contact" 
                className="btn-secondary text-xl px-12 py-5 font-semibold w-full sm:w-auto"
              >
                Contact Sales
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Setup in 30 seconds</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="section-padding bg-surface-elevated">
          <div className="container">
            <div className="grid md:grid-cols-5 gap-8 mb-12">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <img src="/lotus-white.png" alt="Lotus AI" className="h-8 w-auto" />
                  <span className="text-2xl font-bold">Lotus AI</span>
                </div>
                <p className="text-text-secondary mb-6 max-w-md">
                  The most advanced AI assistant with real-time streaming, contextual memory, and privacy-first design. 
                  Experience conversations that truly understand you.
                </p>
                <div className="flex items-center gap-4">
                  <Link href="https://github.com/doctadg/lotus" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </Link>
                  <Link href="#" className="text-text-secondary hover:text-text-primary transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </Link>
                  <Link href="#" className="text-text-secondary hover:text-text-primary transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </Link>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-lg">Product</h3>
                <ul className="space-y-3 text-text-secondary">
                  <li><Link href="/register" className="hover:text-text-primary transition-colors">Get Started</Link></li>
                  <li><Link href="#features" className="hover:text-text-primary transition-colors">Features</Link></li>
                  <li><Link href="#pricing" className="hover:text-text-primary transition-colors">Pricing</Link></li>
                  <li><Link href="/api/health" className="hover:text-text-primary transition-colors">API Status</Link></li>
                  <li><Link href="#" className="hover:text-text-primary transition-colors">Roadmap</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-lg">Resources</h3>
                <ul className="space-y-3 text-text-secondary">
                  <li><Link href="#" className="hover:text-text-primary transition-colors">Documentation</Link></li>
                  <li><Link href="#" className="hover:text-text-primary transition-colors">Tutorials</Link></li>
                  <li><Link href="#" className="hover:text-text-primary transition-colors">Blog</Link></li>
                  <li><Link href="#faq" className="hover:text-text-primary transition-colors">FAQ</Link></li>
                  <li><Link href="#" className="hover:text-text-primary transition-colors">Community</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-lg">Company</h3>
                <ul className="space-y-3 text-text-secondary">
                  <li><Link href="#" className="hover:text-text-primary transition-colors">About</Link></li>
                  <li><Link href="#" className="hover:text-text-primary transition-colors">Careers</Link></li>
                  <li><Link href="#" className="hover:text-text-primary transition-colors">Contact</Link></li>
                  <li><Link href="#" className="hover:text-text-primary transition-colors">Privacy</Link></li>
                  <li><Link href="#" className="hover:text-text-primary transition-colors">Terms</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
              <div className="text-sm text-text-quaternary mb-4 md:mb-0">
                © 2024 Lotus AI. Built with cutting-edge AI technology and lots of ❤️
              </div>
              <div className="flex items-center gap-6 text-sm">
                <Link href="#" className="text-text-tertiary hover:text-text-primary transition-colors">Privacy Policy</Link>
                <Link href="#" className="text-text-tertiary hover:text-text-primary transition-colors">Terms of Service</Link>
                <Link href="#" className="text-text-tertiary hover:text-text-primary transition-colors">Cookie Policy</Link>
                <Link href="#" className="text-text-tertiary hover:text-text-primary transition-colors">Security</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}