"use client"

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, User, Tag, ArrowLeft, Share2 } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import BlogCard from '@/components/blog/BlogCard'
import FadeInView from '@/components/landing/FadeInView'
import StaggerChildren from '@/components/landing/StaggerChildren'
import { getBlogPost, getRelatedPosts, blogPosts } from '@/lib/blog-posts'
import { Button } from '@/components/ui/button'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPost(params.slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = getRelatedPosts(post, 3)

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = `Check out this article: ${post.title}`

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: shareText,
        url: shareUrl,
      })
    } else {
      navigator.clipboard.writeText(shareUrl)
      // You could add a toast notification here
    }
  }

  return (
    <PageLayout
      showBackButton
      backHref="/blog"
      backText="Back to Blog"
      maxWidth="4xl"
      className="prose-container"
    >
      <article>
        {/* Article Header */}
        <FadeInView direction="up" className="mb-12">
          <div className="text-center mb-8">
            {/* Category */}
            <span className="inline-block px-4 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full mb-6">
              {post.category}
            </span>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Subtitle */}
            {post.subtitle && (
              <p className="text-xl md:text-2xl text-neutral-600 dark:text-white/70 mb-8 leading-relaxed max-w-3xl mx-auto">
                {post.subtitle}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-neutral-500 dark:text-white/50 text-sm mb-8">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{post.author.name}</span>
                <span className="text-neutral-400 dark:text-white/30">•</span>
                <span>{post.author.role}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{post.readTime} min read</span>
              </div>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center space-x-1 px-3 py-1 text-sm text-neutral-600 dark:text-white/70 bg-neutral-100 dark:bg-white/10 rounded-full hover:bg-neutral-200 dark:hover:bg-white/20 transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Share Button */}
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="inline-flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Article</span>
            </Button>
          </div>
        </FadeInView>

        {/* Article Content */}
        <FadeInView direction="up" className="mb-16">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div
              className="article-content"
              dangerouslySetInnerHTML={{
                __html: post.content
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/\n/g, '<br />')
                  .replace(/^/, '<p>')
                  .replace(/$/, '</p>')
                  .replace(/# (.*?)(?=<)/g, '<h2>$1</h2>')
                  .replace(/## (.*?)(?=<)/g, '<h3>$1</h3>')
                  .replace(/### (.*?)(?=<)/g, '<h4>$1</h4>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/`(.*?)`/g, '<code>$1</code>')
                  .replace(/<p><\/p>/g, '')
                  .replace(/<p><br \/><\/p>/g, '')
              }}
            />
          </div>
        </FadeInView>

        {/* Article Footer */}
        <FadeInView direction="up" className="border-t border-neutral-200 dark:border-white/20 pt-12 mb-16">
          <div className="bg-neutral-50 dark:bg-white/5 rounded-2xl p-8">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {post.author.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-neutral-900 dark:text-white text-lg mb-1">
                  {post.author.name}
                </h4>
                <p className="text-neutral-600 dark:text-white/70 mb-3">
                  {post.author.role}
                </p>
                <p className="text-neutral-600 dark:text-white/70 text-sm">
                  Contributing to the future of AI at Lotus, focused on creating technology that enhances human capabilities while preserving privacy and personal agency.
                </p>
              </div>
            </div>
          </div>
        </FadeInView>
      </article>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section>
          <FadeInView direction="up" className="mb-8">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center">
              Related Articles
            </h2>
          </FadeInView>
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.1}>
            {relatedPosts.map((relatedPost) => (
              <BlogCard key={relatedPost.id} post={relatedPost} />
            ))}
          </StaggerChildren>
        </section>
      )}
    </PageLayout>
  )
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }))
}

// Generate metadata for each blog post
export async function generateMetadata({ params }: BlogPostPageProps) {
  const post = getBlogPost(params.slug)

  if (!post) {
    return {
      title: 'Post Not Found | Lotus AI Blog',
      description: 'The requested blog post could not be found.',
    }
  }

  return {
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    keywords: post.seo.keywords.join(', '),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}