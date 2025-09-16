"use client"

import Link from 'next/link'
import { Clock, Calendar, User, ArrowRight } from 'lucide-react'
import { BlogPost } from '@/lib/blog-posts'
import HoverCard from '@/components/landing/HoverCard'

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const cardSize = featured ? "md:col-span-2 lg:col-span-2" : ""
  const textSize = featured ? "lg:text-lg" : "text-sm"

  return (
    <HoverCard className={`group bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden ${cardSize}`}>
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="p-6 lg:p-8">
          {/* Category & Featured Badge */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
              {post.category}
            </span>
            {featured && (
              <span className="inline-block px-3 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                Featured
              </span>
            )}
          </div>

          {/* Title & Subtitle */}
          <h3 className={`font-bold text-neutral-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${featured ? 'text-2xl lg:text-3xl' : 'text-xl'}`}>
            {post.title}
          </h3>

          {featured && (
            <p className="text-lg text-neutral-600 dark:text-white/70 mb-4 leading-relaxed">
              {post.subtitle}
            </p>
          )}

          {/* Excerpt */}
          <p className={`text-neutral-600 dark:text-white/70 mb-6 leading-relaxed ${textSize}`}>
            {post.excerpt}
          </p>

          {/* Meta Information */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-neutral-500 dark:text-white/50 text-sm">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{post.author.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{post.readTime} min read</span>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-neutral-400 dark:text-white/40 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200" />
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-1 text-xs text-neutral-500 dark:text-white/50 bg-neutral-100 dark:bg-white/5 rounded-md"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs text-neutral-500 dark:text-white/50">
                  +{post.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </HoverCard>
  )
}