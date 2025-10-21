"use client"

import Link from 'next/link'
import { Clock, Calendar, ArrowRight } from 'lucide-react'
import { BlogPost } from '@/lib/blog-posts'

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <article className="h-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-neutral-300 dark:hover:border-white/20 hover:shadow-lg dark:hover:shadow-white/5">
        <div className="p-6 h-full flex flex-col">
          {/* Category Badge */}
          <div className="mb-3">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-white/70 rounded-full">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h3 className={`font-bold text-neutral-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 ${featured ? 'text-2xl' : 'text-xl'}`}>
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-neutral-600 dark:text-white/60 mb-4 leading-relaxed text-sm line-clamp-3 flex-grow">
            {post.excerpt}
          </p>

          {/* Meta Information */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-white/5">
            <div className="flex items-center gap-4 text-neutral-500 dark:text-white/40 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{post.readTime} min</span>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-neutral-400 dark:text-white/40 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200" />
          </div>
        </div>
      </article>
    </Link>
  )
}