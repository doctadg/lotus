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
    default: "FlowBuilder - Build Internal Tools That Actually Flow",
    template: "%s | FlowBuilder"
  },
  description: "Design lightweight internal apps and workflows with zero friction. Fast to launch. Easy to evolve. Built to feel invisible.",
  keywords: ["internal tools", "workflow builder", "app builder", "drag and drop", "low code", "no code", "workflow automation", "business tools", "team productivity"],
  authors: [{ name: "FlowBuilder Team" }],
  creator: "FlowBuilder",
  publisher: "FlowBuilder",
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
    siteName: 'FlowBuilder',
    title: 'FlowBuilder - Build Internal Tools That Actually Flow',
    description: 'Design lightweight internal apps and workflows with zero friction. Fast to launch. Easy to evolve. Built to feel invisible.',
    images: [
      {
        url: '/lotus-white.png',
        width: 1200,
        height: 630,
        alt: 'FlowBuilder - Build Internal Tools That Actually Flow',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowBuilder - Build Internal Tools That Actually Flow',
    description: 'Design lightweight internal apps and workflows with zero friction. Fast to launch. Easy to evolve. Built to feel invisible.',
    images: ['/lotus-white.png'],
    creator: '@flowbuilder',
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
    <html lang="en" className="dark scroll-smooth">
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
