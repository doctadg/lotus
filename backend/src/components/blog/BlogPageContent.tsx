"use client"

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import BlogCard from '@/components/blog/BlogCard'
import FadeInView from '@/components/landing/FadeInView'
import StaggerChildren from '@/components/landing/StaggerChildren'
import { blogPosts, categories, tags, getFeaturedPosts, getPostsByCategory, getPostsByTag } from '@/lib/blog-posts'

export default function BlogPageContent() {
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
    <>
      {/* Search and Filters */}
      <FadeInView direction="up" className="mb-12">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-white/70 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/20 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-6 p-6 bg-neutral-50 dark:bg-white/5 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Categories */}
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {['All', ...categories].map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                        setSelectedTag('')
                      }}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-white/10 text-neutral-700 dark:text-white/70 hover:bg-blue-100 dark:hover:bg-blue-900/30'
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
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(tag)
                        setSelectedCategory('All')
                      }}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedTag === tag
                          ? 'bg-purple-500 text-white'
                          : 'bg-white dark:bg-white/10 text-neutral-700 dark:text-white/70 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-white/20">
              <button
                onClick={() => {
                  setSelectedCategory('All')
                  setSelectedTag('')
                  setSearchTerm('')
                }}
                className="text-sm text-neutral-600 dark:text-white/60 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </FadeInView>

      {/* Featured Posts */}
      {!searchTerm && selectedCategory === 'All' && !selectedTag && featuredPosts.length > 0 && (
        <section className="mb-16">
          <FadeInView direction="up" className="mb-8">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Featured Articles</h2>
          </FadeInView>
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.1}>
            {featuredPosts.map((post) => (
              <BlogCard key={post.id} post={post} featured />
            ))}
          </StaggerChildren>
        </section>
      )}

      {/* All Posts */}
      <section>
        <FadeInView direction="up" className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
              {searchTerm ? `Search Results (${filteredPosts.length})` :
               selectedCategory !== 'All' ? `${selectedCategory} Articles` :
               selectedTag ? `Posts tagged "${selectedTag}"` : 'Latest Articles'}
            </h2>
            {filteredPosts.length > 0 && (
              <span className="text-neutral-600 dark:text-white/60 text-sm">
                {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </FadeInView>

        {filteredPosts.length > 0 ? (
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.1}>
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </StaggerChildren>
        ) : (
          <FadeInView direction="up" className="text-center py-16">
            <div className="text-neutral-500 dark:text-white/50 mb-4">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No articles found</h3>
              <p>Try adjusting your search terms or filters</p>
            </div>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
                setSelectedTag('')
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span>Clear filters</span>
            </button>
          </FadeInView>
        )}
      </section>
    </>
  )
}