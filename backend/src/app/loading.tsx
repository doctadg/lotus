export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent-primary animate-pulse"></div>
          <span className="text-xl font-semibold text-text-primary">Lotus AI</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
        <p className="text-sm text-text-secondary mt-2">Loading...</p>
      </div>
    </div>
  )
}