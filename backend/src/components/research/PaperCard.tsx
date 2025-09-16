"use client"

import { Download, Calendar, Users, Quote, Award } from 'lucide-react'
import { ResearchPaper } from '@/lib/research-papers'
import HoverCard from '@/components/landing/HoverCard'

interface PaperCardProps {
  paper: ResearchPaper
  featured?: boolean
}

export default function PaperCard({ paper, featured = false }: PaperCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'preprint':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'under-review':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      default:
        return 'bg-neutral-100 dark:bg-neutral-900/30 text-neutral-800 dark:text-neutral-300'
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'published':
        return 'Published'
      case 'preprint':
        return 'Preprint'
      case 'under-review':
        return 'Under Review'
      default:
        return status
    }
  }

  return (
    <HoverCard className={`group bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden ${featured ? 'md:col-span-2' : ''}`}>
      <div className="p-6 lg:p-8">
        {/* Header with Status and Featured Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(paper.status)}`}>
            {formatStatus(paper.status)}
          </span>
          <div className="flex items-center space-x-2">
            {featured && (
              <span className="inline-block px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
                Featured
              </span>
            )}
            {paper.citationCount && paper.citationCount > 0 && (
              <div className="flex items-center space-x-1 text-neutral-500 dark:text-white/50 text-xs">
                <Quote className="w-3 h-3" />
                <span>{paper.citationCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className={`font-bold text-neutral-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${featured ? 'text-2xl lg:text-3xl' : 'text-xl'}`}>
          {paper.title}
        </h3>

        {/* Subtitle for featured papers */}
        {featured && paper.subtitle && (
          <p className="text-lg text-neutral-600 dark:text-white/70 mb-4 leading-relaxed">
            {paper.subtitle}
          </p>
        )}

        {/* Abstract */}
        <p className={`text-neutral-600 dark:text-white/70 mb-6 leading-relaxed ${featured ? 'lg:text-lg' : 'text-sm'}`}>
          {paper.abstract.substring(0, featured ? 300 : 200)}
          {paper.abstract.length > (featured ? 300 : 200) && '...'}
        </p>

        {/* Authors */}
        <div className="mb-4">
          <div className="flex items-center space-x-1 text-neutral-500 dark:text-white/50 text-sm mb-2">
            <Users className="w-4 h-4" />
            <span>Authors</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {paper.authors.map((author, index) => (
              <span
                key={index}
                className="text-sm text-neutral-700 dark:text-white/70"
              >
                {author.name}
                {index < paper.authors.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>

        {/* Venue and Date */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-neutral-500 dark:text-white/50 text-sm">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(paper.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}</span>
            </div>
            {paper.venue && (
              <div className="flex items-center space-x-1">
                <Award className="w-4 h-4" />
                <span className="text-xs">{paper.venue}</span>
              </div>
            )}
          </div>

          {/* Download Button */}
          {paper.downloadUrl && (
            <a
              href={paper.downloadUrl}
              className="inline-flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </a>
          )}
        </div>

        {/* Tags */}
        {paper.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-black/5 dark:border-white/5">
            {paper.tags.slice(0, featured ? 6 : 4).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-1 text-xs text-neutral-500 dark:text-white/50 bg-neutral-100 dark:bg-white/5 rounded-md"
              >
                {tag}
              </span>
            ))}
            {paper.tags.length > (featured ? 6 : 4) && (
              <span className="inline-block px-2 py-1 text-xs text-neutral-500 dark:text-white/50">
                +{paper.tags.length - (featured ? 6 : 4)} more
              </span>
            )}
          </div>
        )}

        {/* DOI */}
        {paper.doi && (
          <div className="mt-4 pt-2 border-t border-black/5 dark:border-white/5">
            <span className="text-xs text-neutral-500 dark:text-white/50">
              DOI: {paper.doi}
            </span>
          </div>
        )}
      </div>
    </HoverCard>
  )
}