"use client"

import { useState } from 'react'
import { Search, Filter, GraduationCap, Award, TrendingUp } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import PaperCard from '@/components/research/PaperCard'
import FadeInView from '@/components/landing/FadeInView'
import StaggerChildren from '@/components/landing/StaggerChildren'
import { researchPapers, researchCategories, researchTags, getFeaturedPapers, getPapersByCategory, getPapersByTag } from '@/lib/research-papers'

export default function ResearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTag, setSelectedTag] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const featuredPapers = getFeaturedPapers()

  // Filter papers based on search and filters
  let filteredPapers = researchPapers

  if (selectedCategory !== 'All') {
    filteredPapers = getPapersByCategory(selectedCategory)
  }

  if (selectedTag) {
    filteredPapers = getPapersByTag(selectedTag)
  }

  if (searchTerm) {
    filteredPapers = filteredPapers.filter(paper =>
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.authors.some(author => author.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      paper.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  return (
    <PageLayout
      title="Research"
      subtitle="Advancing the science of AI through rigorous research in memory systems, privacy, personalization, and human-computer interaction"
      maxWidth="6xl"
    >
      {/* Research Stats */}
      <FadeInView direction="up" className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl">
            <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">
              {researchPapers.length}
            </div>
            <div className="text-neutral-600 dark:text-white/70 text-sm">Published Papers</div>
          </div>
          <div className="text-center p-6 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl">
            <Award className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">
              {researchPapers.reduce((sum, paper) => sum + (paper.citationCount || 0), 0)}
            </div>
            <div className="text-neutral-600 dark:text-white/70 text-sm">Total Citations</div>
          </div>
          <div className="text-center p-6 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl">
            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">
              {Math.round(researchPapers.reduce((sum, paper) => sum + (paper.citationCount || 0), 0) / researchPapers.length)}
            </div>
            <div className="text-neutral-600 dark:text-white/70 text-sm">Avg Citations/Paper</div>
          </div>
        </div>
      </FadeInView>

      {/* Search and Filters */}
      <FadeInView direction="up" className="mb-12">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search papers..."
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
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Research Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {researchCategories.map((category) => (
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
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Keywords</h3>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  <button
                    onClick={() => setSelectedTag('')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedTag === ''
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-white/10 text-neutral-700 dark:text-white/70 hover:bg-blue-50 dark:hover:bg-white/20'
                    }`}
                  >
                    All Keywords
                  </button>
                  {researchTags.map((tag) => (
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

      {/* Featured Papers */}
      {!searchTerm && selectedCategory === 'All' && !selectedTag && featuredPapers.length > 0 && (
        <FadeInView direction="up" className="mb-16">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8">Featured Research</h2>
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.1}>
            {featuredPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} featured />
            ))}
          </StaggerChildren>
        </FadeInView>
      )}

      {/* All Papers */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {searchTerm
              ? `Search Results (${filteredPapers.length})`
              : selectedCategory !== 'All'
              ? `${selectedCategory} Papers`
              : selectedTag
              ? `Papers tagged "${selectedTag}"`
              : 'All Research Papers'
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

        {filteredPapers.length > 0 ? (
          <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.1}>
            {filteredPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </StaggerChildren>
        ) : (
          <FadeInView direction="up" className="text-center py-12">
            <p className="text-neutral-600 dark:text-white/70 text-lg">
              No papers found matching your criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
                setSelectedTag('')
              }}
              className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all papers
            </button>
          </FadeInView>
        )}
      </div>

      {/* Research Focus Areas */}
      <FadeInView direction="up" className="mt-20 pt-16 border-t border-neutral-200 dark:border-white/20">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white text-center mb-12">
          Our Research Focus
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "AI Memory Systems",
              description: "Developing persistent, context-aware memory architectures for personalized AI experiences.",
              icon: "🧠"
            },
            {
              title: "Privacy-First AI",
              description: "Creating AI systems that preserve user privacy while enabling personalization and learning.",
              icon: "🔒"
            },
            {
              title: "Human-AI Collaboration",
              description: "Researching how AI can become true partners in human creativity and productivity.",
              icon: "🤝"
            },
            {
              title: "Multimodal Intelligence",
              description: "Building AI that seamlessly understands and generates across text, images, audio, and video.",
              icon: "🎨"
            }
          ].map((area, index) => (
            <div
              key={index}
              className="text-center p-6 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl"
            >
              <div className="text-4xl mb-4">{area.icon}</div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3 text-lg">
                {area.title}
              </h3>
              <p className="text-neutral-600 dark:text-white/70 text-sm leading-relaxed">
                {area.description}
              </p>
            </div>
          ))}
        </div>
      </FadeInView>
    </PageLayout>
  )
}

export const metadata = {
  title: 'Research | Lotus AI',
  description: 'Advancing the science of AI through rigorous research in memory systems, privacy, personalization, and human-computer interaction',
}