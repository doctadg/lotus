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
    default: "Lotus: The Private, Personal, and Powerful AI You Own",
    template: "%s | Lotus"
  },
  description: "Why rent an AI that watches you, forgets you, and costs $20? Lotus learns you, protects you, and costs less than your coffee. For users who want intelligence—not surveillance.",
  keywords: ["ai assistant", "private ai", "personal ai", "ai chat", "memory ai", "affordable ai", "privacy-first ai", "ai that learns", "intelligent assistant", "ai ownership"],
  authors: [{ name: "Lotus Team" }],
  creator: "Lotus",
  publisher: "Lotus",
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
    siteName: 'Lotus',
    title: 'Lotus: The Private, Personal, and Powerful AI You Own',
    description: 'Why rent an AI that watches you, forgets you, and costs $20? Lotus learns you, protects you, and costs less than your coffee. For users who want intelligence—not surveillance.',
    images: [
      {
        url: '/lotus.svg',
        width: 1200,
        height: 630,
        alt: 'Lotus: The Private, Personal, and Powerful AI You Own',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lotus: The Private, Personal, and Powerful AI You Own',
    description: 'Why rent an AI that watches you, forgets you, and costs $20? Lotus learns you, protects you, and costs less than your coffee. For users who want intelligence—not surveillance.',
    images: ['/lotus.svg'],
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
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{ variables: { colorPrimary: '#8B5CF6' } }}
    >
      <html lang="en" className="scroll-smooth" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preload" href="/lotus.svg" as="image" />
          <meta name="theme-color" content="#8B5CF6" />
          <meta name="color-scheme" content="dark light" />
          {/* Set initial theme to system preference or saved choice without flash */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(() => { try { const ls = localStorage.getItem('theme'); const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; const useDark = ls ? ls === 'dark' : prefersDark; document.documentElement.classList.toggle('dark', useDark); } catch (e) {} })();`,
            }}
          />
          <link rel="icon" href="/lotus.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/lotus.svg" />
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
