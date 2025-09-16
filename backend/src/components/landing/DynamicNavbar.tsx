"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Menu, X, Sun, Moon, ChevronDown, Brain, ImageIcon, Layers } from "lucide-react"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

export default function DynamicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dark, setDark] = useState<boolean | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50
      setScrolled(isScrolled)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const ls = localStorage.getItem('theme')
    if (ls) setDark(ls === 'dark')
    else setDark(document.documentElement.classList.contains('dark'))
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFeaturesDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleTheme = () => {
    const next = !(dark ?? false)
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch {}
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-4 lg:px-8 py-4 transition-all duration-500 ${
        scrolled
          ? "dark:bg-black/80 bg-white/80 backdrop-blur-xl dark:border-b dark:border-white/10 border-b border-black/10 shadow-2xl"
          : "bg-transparent backdrop-blur-sm"
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <img
            src="/lotus-full.svg"
            alt="Lotus"
            className="h-8 w-auto opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 dark:filter dark:brightness-0 dark:invert"
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
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-black/90 backdrop-blur-xl border dark:border-white/10 border-black/10 rounded-xl shadow-2xl py-2 z-50">
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
        <div className="hidden md:flex items-center space-x-4">
          <SignedOut>
            <Link href="/login">
              <span className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300 hover:scale-105 cursor-pointer">
                Login
              </span>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/chat"
              className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              Open App
            </Link>
          </SignedIn>
          <button
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors border dark:border-white/10 border-black/10 bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-white hover:bg-black/10 dark:hover:bg-white/20"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <SignedOut>
            <Link href="/register">
              <Button
                className="relative overflow-hidden transition-all duration-300 hover:-translate-y-1 premium-button text-sm font-bold"
                size="sm"
              >
                <span className="relative z-10 flex items-center">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-neutral-900 dark:text-white p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300"
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

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mt-4 p-6 dark:bg-black/60 bg-white/80 backdrop-blur-xl rounded-2xl border dark:border-white/10 border-black/10 shadow-2xl">
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
            <SignedOut>
              <Link href="/login">
                <span className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-2 cursor-pointer">
                  Login
                </span>
              </Link>
              <Link href="/register">
                <Button
                  className="mt-2 premium-button w-full justify-center font-bold"
                  size="sm"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/chat"
                className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-2"
              >
                Open App
              </Link>
              <div className="mt-3">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="mt-3 p-2 rounded-lg transition-colors border dark:border-white/10 border-black/10 bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-white hover:bg-black/10 dark:hover:bg-white/20 w-full"
            >
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
