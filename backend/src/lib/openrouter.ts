import OpenAI from 'openai'

// Central OpenRouter client configured for multimodal and image generation
export function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY')
  }

  const referer = process.env.OPENROUTER_SITE_URL || undefined
  const title = process.env.OPENROUTER_SITE_NAME || undefined

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      ...(referer ? { 'HTTP-Referer': referer } : {}),
      ...(title ? { 'X-Title': title } : {}),
    },
  })

  return client
}

export const OPENROUTER_IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-2.5-flash-image-preview'

