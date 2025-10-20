import { Logo } from "@/components/ui/Logo"

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative">
        {/* MROR Logo */}
        <div className="relative z-10">
          <Logo variant="full" height={60} className="opacity-90" />
        </div>

        {/* Spinning dots around logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-32 h-32 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/60 rounded-full"></div>
            <div className="absolute top-1/4 right-0 -translate-y-1/2 w-2 h-2 bg-white/60 rounded-full"></div>
            <div className="absolute bottom-1/4 right-0 translate-y-1/2 w-2 h-2 bg-white/60 rounded-full"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/60 rounded-full"></div>
            <div className="absolute bottom-1/4 left-0 translate-y-1/2 w-2 h-2 bg-white/60 rounded-full"></div>
            <div className="absolute top-1/4 left-0 -translate-y-1/2 w-2 h-2 bg-white/60 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}