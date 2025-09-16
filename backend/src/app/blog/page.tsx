"use client"

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import BlogCard from '@/components/blog/BlogCard'
import FadeInView from '@/components/landing/FadeInView'
import StaggerChildren from '@/components/landing/StaggerChildren'
import { blogPosts, categories, tags, getFeaturedPosts, getPostsByCategory, getPostsByTag } from '@/lib/blog-posts'

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTag, setSelectedTag] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const featuredPosts = getFeaturedPosts()

  // Filter posts based on search and filters
  let filteredPosts = blogPosts

  if (selectedCategory !== 'All') {
    filteredPosts = getPostsByCategory(selectedCategory)
  }

  if (selectedTag) {
    filteredPosts = getPostsByTag(selectedTag)
  }

  if (searchTerm) {
    filteredPosts = filteredPosts.filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  return (
    <PageLayout
      title="Lotus AI Blog"
      subtitle="Insights on AI, privacy, technology, and the future of personalized intelligence"
      maxWidth="6xl"
    >
      {/* Search and Filters */}
      <FadeInView direction="up" className="mb-12">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-200 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-3 border border-neutral-200 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-6 p-6 border border-neutral-200 dark:border-white/20 rounded-lg bg-neutral-50 dark:bg-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Categories */}
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                        setSelectedTag('')
                      }}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-white/10 text-neutral-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-white/20'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  <button
                    onClick={() => setSelectedTag('')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedTag === ''
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-white/10 text-neutral-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-white/20'
                    }`}
                  >
                    All Tags
                  </button>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedTag === tag
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-white/10 text-neutral-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-white/20'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </FadeInView>

      {/* Featured Posts */}
      {!searchTerm && selectedCategory === 'All' && !selectedTag && featuredPosts.length > 0 && (
        <FadeInView direction="up" className="mb-16">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8">Featured Articles</h2>
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.1}>
            {featuredPosts.map((post) => (
              <BlogCard key={post.id} post={post} featured />
            ))}
          </StaggerChildren>
        </FadeInView>
      )}

      {/* All Posts */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {searchTerm
              ? `Search Results (${filteredPosts.length})`
              : selectedCategory !== 'All'
              ? `${selectedCategory} Articles`
              : selectedTag
              ? `Articles tagged "${selectedTag}"`
              : 'All Articles'
            }
          </h2>
          {(selectedCategory !== 'All' || selectedTag || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
                setSelectedTag('')
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredPosts.length > 0 ? (
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.1}>
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </StaggerChildren>
        ) : (
          <FadeInView direction="up" className="text-center py-12">
            <p className="text-neutral-600 dark:text-white/70 text-lg">
              No articles found matching your criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
                setSelectedTag('')
              }}
              className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all articles
            </button>
          </FadeInView>
        )}
      </div>
    </PageLayout>
  )
}

export const metadata = {
  title: 'Blog | Lotus AI',
  description: 'Insights on AI, privacy, technology, and the future of personalized intelligence',
}