import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://lotus-ai.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/admin/',
          '/private/',
        ],
      },
      {
        userAgent: '*',
        allow: [
          '/api/health',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}