import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Mror AI',
  description: 'Insights on AI, privacy, technology, and the future of personalized intelligence',
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
