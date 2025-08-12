"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import ShinyText from "../landing/ShinyText"
import ScrambledText from "../landing/ScrambledText"
import TextType from "../landing/TextType"
import Dither from "../landing/Dither"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

interface AuthFormProps {
  type: "login" | "signup"
}

export default function AuthForm({ type }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (type === "login") {
        await signIn(formData.email, formData.password)
        router.push("/chat")
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match")
          setLoading(false)
          return
        }
        await signUp(formData.email, formData.password, formData.name)
        router.push("/chat")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
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

      <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/20 relative z-10 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-3xl font-bold text-white">
            <ShinyText
              text={type === "login" ? "Welcome Back" : "Join Lotus"}
              disabled={false}
              speed={3}
              className="text-3xl font-bold"
            />
          </CardTitle>
          <CardDescription className="text-gray-300 text-lg">
            <TextType
              text={
                type === "login"
                  ? ["Sign in to your account", "Access your AI assistant", "Continue your journey"]
                  : ["Start your AI journey", "Experience intelligent assistance", "Join the Lotus community"]
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15 h-12"
                required
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
                />
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-300"
            >
              <span className="relative z-10">
                {loading ? "Loading..." : type === "login" ? "Sign In" : "Create Account"}
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
              variant="outline"
              className="h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-300"
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
              variant="outline"
              className="h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-300"
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
        </CardContent>
      </Card>
    </div>
  )
}