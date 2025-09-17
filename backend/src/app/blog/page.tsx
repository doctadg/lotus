import PageLayout from '@/components/layout/PageLayout'
import BlogPageContent from '@/components/blog/BlogPageContent'

export default function BlogPage() {
  return (
    <PageLayout
      title="Lotus AI Blog"
      subtitle="Insights on AI, privacy, technology, and the future of personalized intelligence"
      maxWidth="6xl"
    >
      <BlogPageContent />
    </PageLayout>
  )
}

export const metadata = {
  title: 'Blog | Lotus AI',
  description: 'Insights on AI, privacy, technology, and the future of personalized intelligence',
}