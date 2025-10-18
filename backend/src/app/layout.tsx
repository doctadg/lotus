import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
    default: "MROR: AI That Adapts to Your World",
    template: "%s | MROR"
  },
  description: "Stop repeating yourself. MROR learns your style, remembers your context, and adapts to become uniquely yours. AI that evolves with you.",
  keywords: ["ai assistant", "adaptive ai", "personal ai", "ai chat", "memory ai", "affordable ai", "privacy-first ai", "ai that learns", "intelligent assistant", "mror"],
  authors: [{ name: "MROR Team" }],
  creator: "MROR",
  publisher: "MROR",
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
    siteName: 'MROR',
    title: 'MROR: AI That Adapts to Your World',
    description: 'Stop repeating yourself. MROR learns your style, remembers your context, and adapts to become uniquely yours. AI that evolves with you.',
    images: [
      {
        url: '/mror.png',
        width: 1200,
        height: 630,
        alt: 'MROR: AI That Adapts to Your World',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MROR: AI That Adapts to Your World',
    description: 'Stop repeating yourself. MROR learns your style, remembers your context, and adapts to become uniquely yours. AI that evolves with you.',
    images: ['/mror.png'],
    creator: '@mror_ai',
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
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{ variables: { colorPrimary: '#8B5CF6' } }}
    >
      <html lang="en" className="scroll-smooth" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preload" href="/mror.png" as="image" />
          <meta name="theme-color" content="#8B5CF6" />
          <meta name="color-scheme" content="dark light" />
          {/* Set initial theme to system preference or saved choice without flash */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(() => { try { const ls = localStorage.getItem('theme'); const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; const useDark = ls ? ls === 'dark' : prefersDark; document.documentElement.classList.toggle('dark', useDark); } catch (e) {} })();`,
            }}
          />
          <link rel="icon" href="/favicon.png" type="image/png" />
          <link rel="apple-touch-icon" href="/mror.png" />
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
    </ClerkProvider>
  );
}
