"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import ShinyText from "../landing/ShinyText"
import ScrambledText from "../landing/ScrambledText"
import TextType from "../landing/TextType"
import EmailVerification from "./EmailVerification"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

interface AuthFormProps {
  type: "login" | "signup"
}

type AuthState = 'form' | 'verification'

export default function AuthForm({ type }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [authState, setAuthState] = useState<AuthState>('form')
  
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithOAuth,
    isAuthenticated, 
    isLoading 
  } = useAuth()
  const router = useRouter()

  // Don't auto-redirect - let user navigate manually
  // This prevents redirect loops

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (type === "login") {
        const result = await signInWithEmail(formData.email, formData.password)
        
        if (result.success) {
          // Redirect on success
          router.push('/chat')
        } else {
          setError(result.error || "Sign in failed")
        }
      } else {
        // Signup flow
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match")
          setLoading(false)
          return
        }

        if (formData.password.length < 8) {
          setError("Password must be at least 8 characters long")
          setLoading(false)
          return
        }
        
        const result = await signUpWithEmail(
          formData.email, 
          formData.password, 
          formData.name
        )
        
        if (result.success && result.needsVerification) {
          setAuthState('verification')
        } else if (result.success) {
          // Redirect on success without verification
          router.push('/chat')
        } else {
          setError(result.error || "Sign up failed")
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleOAuthSignIn = async (provider: 'oauth_google' | 'oauth_github') => {
    try {
      setLoading(true)
      await signInWithOAuth(provider)
      // The redirect is handled by Clerk
    } catch (err: any) {
      console.error('OAuth error:', err)
      setError(err.message || `${provider.split('_')[1]} sign in failed`)
      setLoading(false)
    }
  }

  // Show verification screen if needed
  if (authState === 'verification') {
    return (
      <EmailVerification
        email={formData.email}
        onBack={() => setAuthState('form')}
      />
    )
  }

  // Don't show loading state to prevent flashing

  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-4 relative overflow-hidden overflow-x-hidden">
      {/* Lightweight static background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.15),_transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,_rgba(59,130,246,0.12),_transparent_55%)]" />

      {/* Lotus Branding Header */}
      <div className="mb-8 text-center relative z-10">
        <Link href="/" className="inline-block">
          <img 
            src="/lotus-full.svg" 
            alt="Lotus" 
            className="h-12 w-auto opacity-90 hover:opacity-100 transition-opacity filter brightness-0 invert"
          />
        </Link>
      </div>

      <Card className="w-full max-w-md bg-white/5 backdrop-blur-sm border border-white/10 relative z-10 shadow-lg shadow-purple-500/10 transition-colors duration-300">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-3xl font-bold text-white">
            <ShinyText
              text={type === "login" ? "Welcome Back" : "Own Your AI"}
              disabled={false}
              speed={3}
              className="text-3xl font-bold"
            />
          </CardTitle>
          <CardDescription className="text-gray-300 text-lg">
            <TextType
              text={
                type === "login"
                  ? ["Your AI that remembers you", "Privacy-first intelligence", "Continue where you left off"]
                  : ["$5/month, not $20", "Your data stays yours", "Intelligence without surveillance"]
              }
              typingSpeed={50}
              pauseDuration={2000}
              showCursor={false}
              variableSpeed={undefined}
              onSentenceComplete={undefined}
            />
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {type === "signup" && (
              <div className="space-y-2 group">
                <Label htmlFor="name" className="text-white font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15 h-12"
                  required
                />
              </div>
            )}

            <div className="space-y-2 group">
              <Label htmlFor="email" className="text-white font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15 h-12"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2 group">
              <Label htmlFor="password" className="text-white font-medium">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={type === "signup" ? "Minimum 8 characters" : "Enter your password"}
                value={formData.password}
                onChange={handleChange}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15 h-12"
                required
                disabled={loading}
                minLength={type === "signup" ? 8 : undefined}
              />
            </div>

            {type === "signup" && (
              <div className="space-y-2 group">
                <Label htmlFor="confirmPassword" className="text-white font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15 h-12"
                  required
                  disabled={loading}
                />
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            {type === "signup" && (
              <div className="pt-2 flex justify-center">
                {/* Smart CAPTCHA (Cloudflare Turnstile) mount point */}
                <div id="clerk-captcha" />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">
                {loading ? "Processing..." : type === "login" ? "Sign In" : "Create Account"}
              </span>
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn('oauth_google')}
              disabled={loading}
              className="h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn('oauth_github')}
              disabled={loading}
              className="h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </Button>
          </div>

          <div className="text-center space-y-4">
            <p className="text-gray-400">
              {type === "login" ? "Don't have an account? " : "Already have an account? "}
              <Link
                href={type === "login" ? "/register" : "/login"}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors hover:underline"
              >
                {type === "login" ? "Sign up" : "Sign in"}
              </Link>
            </p>

            {type === "login" && (
              <div className="text-center">
                <ScrambledText
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                  radius={50}
                  duration={0.8}
                  speed={0.3}
                  scrambleChars="?!@#$%^&*"
                >
                  Forgot your password?
                </ScrambledText>
              </div>
            )}
          </div>

          {/* Privacy Message */}
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-xs text-gray-400 leading-relaxed">
              {type === "signup" 
                ? "We never train on your data. Your conversations stay private. Cancel anytime." 
                : "Your data stays yours. Privacy-first AI you can trust."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
