"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Menu, X } from "lucide-react"

export default function DynamicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50
      setScrolled(isScrolled)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-4 lg:px-8 py-4 transition-all duration-500 ${
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl"
          : "bg-transparent backdrop-blur-sm"
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 transition-transform duration-300 group-hover:scale-110">
            <img
              src="/lotus.svg"
              alt="FlowBuilder"
              className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <span className="text-white font-semibold text-xl group-hover:text-blue-300 transition-colors">
            FlowBuilder
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {["Product", "Templates", "Use Cases", "Pricing", "Docs"].map((item) => (
            <Link
              key={item}
              href="#"
              className="relative text-white/80 hover:text-white text-sm font-medium transition-all duration-300 group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/login"
            className="text-white/80 hover:text-white text-sm font-medium transition-all duration-300 hover:scale-105"
          >
            Login
          </Link>
          <Link href="/signup">
            <Button
              className="relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm"
              size="sm"
            >
              <span className="relative z-10 flex items-center">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
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
        <div className="mt-4 p-6 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex flex-col space-y-4">
            {["Product", "Templates", "Use Cases", "Pricing", "Docs"].map((item, index) => (
              <Link
                key={item}
                href="#"
                className="text-white/80 hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-2 hover:text-blue-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {item}
              </Link>
            ))}
            <hr className="border-white/20 my-2" />
            <Link
              href="/login"
              className="text-white/80 hover:text-white text-sm font-medium transition-all duration-300 hover:translate-x-2"
            >
              Login
            </Link>
            <Link href="/signup">
              <Button
                className="bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-500 hover:to-purple-500 border border-white/20 text-white backdrop-blur-sm w-full justify-center transition-all duration-300 hover:scale-105"
                size="sm"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
