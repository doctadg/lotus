import { traceable as langsmithTraceable } from 'langsmith/traceable'

// Tracing is disabled by default for latency. Enable by setting TRACING_ENABLED=true
// and providing a valid LANGSMITH_API_KEY.
const tracingEnabled = process.env.TRACING_ENABLED === 'true' && !!process.env.LANGSMITH_API_KEY

type TraceableFn<T extends (...args: any[]) => any> = (
  fn: T,
  options?: Record<string, any>
) => T

export const maybeTraceable: TraceableFn<any> = (fn: any, options?: Record<string, any>) => {
  if (!tracingEnabled) return fn
  return langsmithTraceable(fn as any, options as any) as any
}

export const isTracingEnabled = () => tracingEnabled

