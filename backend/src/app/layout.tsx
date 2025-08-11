import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "../lib/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    default: "Lotus AI - Intelligent Chat Assistant with Real-time Streaming",
    template: "%s | Lotus AI"
  },
  description: "Experience the next generation of AI assistance with Lotus. Intelligent, contextual, and remarkably human conversations powered by advanced AI technology. Real-time streaming, memory system, and privacy-first design.",
  keywords: ["AI chat", "artificial intelligence", "chat assistant", "AI conversation", "real-time streaming", "contextual AI", "privacy-first AI", "intelligent assistant", "AI technology", "conversational AI"],
  authors: [{ name: "Lotus AI Team" }],
  creator: "Lotus AI",
  publisher: "Lotus AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Lotus AI',
    title: 'Lotus AI - Intelligent Chat Assistant with Real-time Streaming',
    description: 'Experience the next generation of AI assistance with Lotus. Intelligent, contextual, and remarkably human conversations powered by advanced AI technology.',
    images: [
      {
        url: '/lotus-white.png',
        width: 1200,
        height: 630,
        alt: 'Lotus AI - Intelligent Chat Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lotus AI - Intelligent Chat Assistant',
    description: 'Experience the next generation of AI assistance with Lotus. Real-time streaming, contextual intelligence, and privacy-first design.',
    images: ['/lotus-white.png'],
    creator: '@lotus_ai',
  },
  verification: {
    google: 'google-site-verification-code-here',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/lotus-white.png" as="image" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="color-scheme" content="dark" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/lotus-white.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
