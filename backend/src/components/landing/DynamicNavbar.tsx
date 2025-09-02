"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Menu, X, Sun, Moon } from "lucide-react"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

export default function DynamicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dark, setDark] = useState<boolean | null>(null)

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
          {["Product", "Templates", "Use Cases", "Pricing", "Docs"].map((item) => (
            <Link
              key={item}
              href="#"
              className="relative text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300 group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
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
                className="relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 dark:bg-white/10 dark:hover:bg-white/20 bg-black/5 hover:bg-black/10 dark:border-white/20 border-black/20 text-neutral-900 dark:text-white backdrop-blur-sm"
                size="sm"
              >
                <span className="relative z-10 flex items-center">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
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
            {["Product", "Templates", "Use Cases", "Pricing", "Docs"].map((item, index) => (
              <Link
                key={item}
                href="#"
                className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {item}
              </Link>
            ))}
            <hr className="border-white/20 my-2" />
            <SignedOut>
              <Link href="/login">
                <span className="text-neutral-700 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-2 cursor-pointer">
                  Login
                </span>
              </Link>
              <Link href="/register">
                <Button
                  className="mt-2 bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-500 hover:to-purple-500 border dark:border-white/20 border-black/20 text-white backdrop-blur-sm w-full justify-center transition-all duration-300 hover:scale-105"
                  size="sm"
                >
                  Get Started
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
