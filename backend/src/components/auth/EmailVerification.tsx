'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface EmailVerificationProps {
  email: string
  onBack: () => void
}

export default function EmailVerification({ email, onBack }: EmailVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { verifyEmail, resendVerificationEmail } = useAuth()
  const router = useRouter()

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters
    
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const verificationCode = code.join('')
    if (verificationCode.length !== 6) {
      setError('Please enter the complete verification code')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const result = await verifyEmail(verificationCode)
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/chat')
        }, 1500)
      } else {
        setError(result.error || 'Verification failed')
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    
    setResendLoading(true)
    setError('')
    
    try {
      const result = await resendVerificationEmail()
      
      if (result.success) {
        setResendCooldown(30) // 30 second cooldown
        setCode(['', '', '', '', '', '']) // Clear the code
        inputRefs.current[0]?.focus()
      } else {
        setError(result.error || 'Failed to resend code')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.15),_transparent_60%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,_rgba(59,130,246,0.12),_transparent_55%)]" />

        <Card className="w-full max-w-md bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg shadow-purple-500/10">
          <CardContent className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-gray-300">
              Your account has been successfully verified. Redirecting you to Lotus...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.15),_transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,_rgba(59,130,246,0.12),_transparent_55%)]" />

      {/* Logo */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          <img 
            src="/lotus-full.svg" 
            alt="Lotus" 
            className="h-12 w-auto opacity-90 hover:opacity-100 transition-opacity filter brightness-0 invert"
          />
        </Link>
      </div>

      <Card className="w-full max-w-md bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg shadow-purple-500/10">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-gray-300 text-base">
            We've sent a 6-digit verification code to<br />
            <span className="font-semibold text-white">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-3 text-center">
              Enter verification code
            </label>
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-white text-lg font-semibold bg-white/10 border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 rounded-lg"
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <Button
            onClick={handleVerify}
            disabled={loading || code.join('').length !== 6}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors duration-300"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>

          <div className="text-center text-gray-400 text-sm">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className="text-blue-400 hover:text-blue-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign up
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}