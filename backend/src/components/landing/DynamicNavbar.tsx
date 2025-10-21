"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, Menu, X, ChevronDown, Brain, ImageIcon, Layers, LogIn, User, LogOut } from "lucide-react"
import { Logo } from "@/components/ui/Logo"
import { useAuth } from "@/hooks/useAuth"
import { useClerk } from "@clerk/nextjs"

export default function DynamicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  const { isAuthenticated, user, signOut } = useAuth()
  const { openSignIn, openSignUp } = useClerk()

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50
      setScrolled(isScrolled)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFeaturesDropdownOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 px-4 lg:px-8 transition-all duration-500 ${scrolled ? 'pt-4' : 'pt-6'}`}>
      <div className={`max-w-7xl mx-auto transition-all duration-500 ${
        scrolled
          ? "premium-card backdrop-blur-2xl border-2 border-white/20 shadow-2xl rounded-2xl px-6 py-3"
          : "bg-transparent px-6 py-4"
      }`}>
        <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Logo
            variant="full"
            height={28}
            className="opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {/* Features Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setFeaturesDropdownOpen(!featuresDropdownOpen)}
              className="flex items-center text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300 group"
            >
              Features
              <ChevronDown className={`ml-1 w-4 h-4 transition-transform duration-200 ${featuresDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {featuresDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 premium-card backdrop-blur-2xl rounded-xl border-2 border-white/20 shadow-2xl py-2 z-50">
                <Link
                  href="/features"
                  className="flex items-center px-4 py-3 text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                  onClick={() => setFeaturesDropdownOpen(false)}
                >
                  <Layers className="w-4 h-4 mr-3 text-neutral-500 dark:text-white/50" />
                  <div>
                    <div className="font-medium text-sm">All Features</div>
                    <div className="text-xs text-neutral-500 dark:text-white/50">Complete overview</div>
                  </div>
                </Link>
                <Link
                  href="/features/memory"
                  className="flex items-center px-4 py-3 text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                  onClick={() => setFeaturesDropdownOpen(false)}
                >
                  <Brain className="w-4 h-4 mr-3 text-neutral-500 dark:text-white/50" />
                  <div>
                    <div className="font-medium text-sm">AI Memory</div>
                    <div className="text-xs text-neutral-500 dark:text-white/50">Persistent context</div>
                  </div>
                </Link>
                <Link
                  href="/features/images"
                  className="flex items-center px-4 py-3 text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
                  onClick={() => setFeaturesDropdownOpen(false)}
                >
                  <ImageIcon className="w-4 h-4 mr-3 text-neutral-500 dark:text-white/50" />
                  <div>
                    <div className="font-medium text-sm">Image Tools</div>
                    <div className="text-xs text-neutral-500 dark:text-white/50">Generate & edit</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Other Nav Links */}
          <Link
            href="/blog"
            className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300"
          >
            Blog
          </Link>
          <Link
            href="/research"
            className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300"
          >
            Research
          </Link>
          <Link
            href="/pricing"
            className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300"
          >
            Pricing
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center space-x-3">
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => openSignIn()}
                className="group relative px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-300 hover:scale-105 bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg"
              >
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  Login
                </span>
              </button>
              <button
                onClick={() => openSignUp()}
                className="group relative px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 premium-button hover:shadow-2xl overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            </>
          ) : (
            <>
              <Link href="/chat">
                <button className="group relative px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-300 hover:scale-105 bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg">
                  <span className="flex items-center gap-2">
                    Open App
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </button>
              </Link>
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
                >
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 hover:border-white/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 premium-card backdrop-blur-2xl rounded-xl border-2 border-white/20 shadow-2xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="font-medium text-white text-sm">{user?.name || 'User'}</div>
                      <div className="text-white/60 text-xs mt-0.5">{user?.email}</div>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200"
                    >
                      <User className="w-4 h-4 mr-3" />
                      <span className="text-sm">Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        signOut()
                        setUserDropdownOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-neutral-900 dark:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <div className="relative w-6 h-6">
            <Menu
              className={`absolute inset-0 transition-all duration-300 ${mobileMenuOpen ? "opacity-0 rotate-180" : "opacity-100 rotate-0"}`}
            />
            <X
              className={`absolute inset-0 transition-all duration-300 ${mobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-180"}`}
            />
          </div>
        </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ${
          mobileMenuOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}
      >
        <div className="premium-card p-6 backdrop-blur-2xl rounded-2xl border-2 border-white/20 shadow-2xl">
          <div className="flex flex-col space-y-4">
            {/* Mobile Navigation Links */}
            <Link
              href="/features"
              className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/blog"
              className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/research"
              className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Research
            </Link>
            <Link
              href="/pricing"
              className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <hr className="border-white/20 my-2" />
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    openSignIn()
                    setMobileMenuOpen(false)
                  }}
                  className="group w-full px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-300 bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 hover:border-white/30"
                >
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    Login
                  </span>
                </button>
                <button
                  onClick={() => {
                    openSignUp()
                    setMobileMenuOpen(false)
                  }}
                  className="group w-full mt-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 premium-button"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link href="/chat" onClick={() => setMobileMenuOpen(false)}>
                  <button className="group w-full px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-300 bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 hover:border-white/30">
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        Open App
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </span>
                  </button>
                </Link>
                <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/20">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={user.name || 'User'} className="w-10 h-10 rounded-full border-2 border-white/20" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-white">{user?.name || 'User'}</div>
                    <div className="text-white/60 text-xs">{user?.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }}
                  className="group w-full mt-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-300 bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-red-500/10 hover:border-red-500/30"
                >
                  <span className="flex items-center gap-2 text-red-400">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
