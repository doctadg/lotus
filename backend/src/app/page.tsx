'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"

export default function Home() {
  const [stats, setStats] = useState({ uptime: '0ms', status: 'checking...' })

  useEffect(() => {
    // Check API health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats({ uptime: 'Online', status: 'All systems operational' })
        }
      })
      .catch(() => {
        setStats({ uptime: 'Offline', status: 'Service unavailable' })
      })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🤖</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Lotus AI</h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/api/health" className="text-gray-300 hover:text-white transition-colors">
              API Status
            </Link>
            <Link href="https://github.com/doctadg/lotus" className="text-gray-300 hover:text-white transition-colors">
              GitHub
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-8">
            <div className={`w-2 h-2 rounded-full ${stats.uptime === 'Online' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}></div>
            <span className="text-emerald-300 text-sm font-medium">{stats.status}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            AI Chat with
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> Streaming</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the next generation of AI conversations with real-time streaming responses, 
            powered by LangChain and OpenRouter.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button 
              onClick={() => window.open('exp://192.168.1.100:8081', '_blank')}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105"
            >
              🚀 Launch Mobile App
            </button>
            
            <Link 
              href="/api/health"
              className="border border-gray-600 text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 hover:border-gray-500 transition-all duration-300"
            >
              📊 View API Status
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Real-time Streaming</h3>
              <p className="text-gray-400">Watch AI responses appear in real-time with smooth streaming technology</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Advanced AI Agent</h3>
              <p className="text-gray-400">Powered by LangChain with function calling and tool integration</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Cross-Platform</h3>
              <p className="text-gray-400">React Native mobile app with web support and responsive design</p>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="mt-20 bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-white mb-6">API Endpoints</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <div className="text-emerald-400 font-mono">/api/health</div>
                <div className="text-gray-400">Health check</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="text-blue-400 font-mono">/api/chat</div>
                <div className="text-gray-400">Chat management</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="text-purple-400 font-mono">/api/chat/[id]/stream</div>
                <div className="text-gray-400">Streaming messages</div>
              </div>
              <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4">
                <div className="text-pink-400 font-mono">/api/user/profile</div>
                <div className="text-gray-400">User management</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded"></div>
              <span className="text-gray-400">Built with Next.js, Prisma, and LangChain</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <a href="https://github.com/doctadg/lotus" className="text-gray-400 hover:text-white transition-colors">
                GitHub
              </a>
              <a href="/api/health" className="text-gray-400 hover:text-white transition-colors">
                API Docs
              </a>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">Status: {stats.uptime}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}