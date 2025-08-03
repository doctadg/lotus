import { config } from 'dotenv'
import path from 'path'

config({ path: path.join(process.cwd(), '.env') })

export interface SwiftSearchOptions {
  query: string
  auto_scrape_top?: number
  max_results?: number
  include_contacts?: boolean
  include_social?: boolean
}

export interface ScrapeForgeOptions {
  url: string
  follow_internal_links?: boolean
  max_depth?: number
  max_pages?: number
  include_contacts?: boolean
  extract_options?: string[]
}

export interface DeepDiveOptions {
  topic: string
  max_sources?: number
  generate_summary?: boolean
  include_social_mentions?: boolean
}

export interface SearchResult {
  title: string
  link: string
  snippet: string
  position: number
}

export interface ScrapedContent {
  url: string
  title: string
  text: string
  error: string | null
  links?: Array<{ href: string; text: string }>
  images?: string[]
  metadata?: Record<string, unknown>
}

export interface ContactInfo {
  type: string
  value: string
  source_url: string
}

export interface SocialProfile {
  platform: string
  url: string
  username: string
}

export interface SwiftSearchResponse {
  query: string
  search_results: SearchResult[]
  scraped_content: ScrapedContent[]
  contacts: ContactInfo[]
  social_profiles: SocialProfile[]
  credits_used: number
  remaining_credits: number
  results_count: number
  scraped_count: number
}

export interface ScrapeForgeResponse {
  url: string
  primary_content: ScrapedContent
  discovered_links: ScrapedContent[]
  contacts: ContactInfo[]
  credits_used: number
  remaining_credits: number
  success: boolean
}

export interface DeepDiveResponse {
  topic: string
  search_results: SearchResult[]
  scraped_content: ScrapedContent[]
  sources_analyzed: number
  ai_summary?: string
  social_mentions?: Array<{
    platform: string
    mentions: number
    sentiment: string
    recent_posts: unknown[]
  }>
  credits_used: number
  remaining_credits: number
  research_depth: string
}

export class SearchHiveClient {
  private apiKey: string
  private baseUrl: string = 'https://api.searchhive.com/api/v1'

  constructor() {
    const apiKey = process.env.SEARCHHIVE_API_KEY
    if (!apiKey) {
      throw new Error('SearchHive API key is required. Set SEARCHHIVE_API_KEY environment variable.')
    }
    this.apiKey = apiKey
  }

  private async makeRequest<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`SearchHive API error (${response.status}): ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`SearchHive request failed: ${error}`)
    }
  }

  async swiftSearch(options: SwiftSearchOptions): Promise<SwiftSearchResponse> {
    const params = {
      query: options.query,
      auto_scrape_top: options.auto_scrape_top || 3,
      max_results: options.max_results || 10,
      include_contacts: options.include_contacts || false,
      include_social: options.include_social || false,
    }

    return this.makeRequest<SwiftSearchResponse>('/swiftsearch', params)
  }

  async scrapeForge(options: ScrapeForgeOptions): Promise<ScrapeForgeResponse> {
    const params = {
      url: options.url,
      follow_internal_links: options.follow_internal_links || false,
      max_depth: options.max_depth || 1,
      max_pages: options.max_pages || 10,
      include_contacts: options.include_contacts || false,
      extract_options: options.extract_options || ['title', 'text'],
    }

    return this.makeRequest<ScrapeForgeResponse>('/scrapeforge', params)
  }

  async deepDive(options: DeepDiveOptions): Promise<DeepDiveResponse> {
    const params = {
      topic: options.topic,
      max_sources: options.max_sources || 5,
      generate_summary: options.generate_summary || false,
      include_social_mentions: options.include_social_mentions || false,
    }

    return this.makeRequest<DeepDiveResponse>('/deepdive', params)
  }
}

export class SearchHiveService {
  private client: SearchHiveClient

  constructor() {
    this.client = new SearchHiveClient()
  }

  async performSwiftSearch(query: string, includeContacts = false): Promise<string> {
    try {
      const result = await this.client.swiftSearch({
        query,
        auto_scrape_top: 3,
        max_results: 8,
        include_contacts: includeContacts,
        include_social: false,
      })

      return this.formatSwiftSearchResults(result)
    } catch (error) {
      console.error('SwiftSearch error:', error)
      return `Error performing search: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  async performDeepResearch(topic: string, includeSummary = true): Promise<string> {
    try {
      const result = await this.client.deepDive({
        topic,
        max_sources: 8,
        generate_summary: includeSummary,
        include_social_mentions: false,
      })

      return this.formatDeepDiveResults(result)
    } catch (error) {
      console.error('DeepDive error:', error)
      return `Error performing deep research: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  private formatSwiftSearchResults(result: SwiftSearchResponse): string {
    let output = `Search Results for "${result.query}":\n\n`

    // Add search results
    if (result.search_results.length > 0) {
      output += `📊 Found ${result.results_count} search results:\n`
      result.search_results.slice(0, 5).forEach((item, index) => {
        output += `${index + 1}. **${item.title}**\n   ${item.snippet}\n   🔗 ${item.link}\n\n`
      })
    }

    // Add scraped content summaries
    if (result.scraped_content.length > 0) {
      output += `📄 Content from ${result.scraped_count} top sources:\n\n`
      result.scraped_content.forEach((content) => {
        if (content.error) {
          output += `❌ ${content.url}: ${content.error}\n`
        } else {
          const summary = content.text.length > 300 
            ? content.text.substring(0, 300) + '...' 
            : content.text
          output += `**${content.title}**\n${summary}\n🔗 ${content.url}\n\n`
        }
      })
    }

    // Add contact information if found
    if (result.contacts.length > 0) {
      output += `📞 Contact Information:\n`
      result.contacts.forEach((contact) => {
        output += `- ${contact.type}: ${contact.value} (from ${contact.source_url})\n`
      })
      output += '\n'
    }

    output += `\n💳 Credits used: ${result.credits_used} | Remaining: ${result.remaining_credits}`
    output += `\n🔍 Powered by SearchHive`

    return output
  }

  private formatDeepDiveResults(result: DeepDiveResponse): string {
    let output = `🔬 Deep Research on "${result.topic}":\n\n`

    // Add AI summary if available
    if (result.ai_summary) {
      output += `📋 **Executive Summary:**\n${result.ai_summary}\n\n`
    }

    // Add key sources
    if (result.search_results.length > 0) {
      output += `📚 **Key Sources (${result.sources_analyzed} analyzed):**\n`
      result.search_results.slice(0, 3).forEach((item, index) => {
        output += `${index + 1}. **${item.title}**\n   ${item.snippet}\n   🔗 ${item.link}\n\n`
      })
    }

    // Add detailed content from top sources
    if (result.scraped_content.length > 0) {
      output += `📖 **Detailed Findings:**\n\n`
      result.scraped_content.slice(0, 3).forEach((content) => {
        if (!content.error) {
          const summary = content.text.length > 400 
            ? content.text.substring(0, 400) + '...' 
            : content.text
          output += `**${content.title}**\n${summary}\n🔗 ${content.url}\n\n`
        }
      })
    }

    // Add social mentions if available
    if (result.social_mentions && result.social_mentions.length > 0) {
      output += `📱 **Social Media Insights:**\n`
      result.social_mentions.forEach((mention) => {
        output += `- ${mention.platform}: ${mention.mentions} mentions (${mention.sentiment} sentiment)\n`
      })
      output += '\n'
    }

    output += `\n💳 Credits used: ${result.credits_used} | Remaining: ${result.remaining_credits}`
    output += `\n🔬 Research depth: ${result.research_depth}`
    output += `\n🔍 Powered by SearchHive`

    return output
  }

  needsCurrentInfo(query: string): boolean {
    const currentInfoKeywords = [
      'latest', 'recent', 'current', 'today', 'now', 'this year', '2024', '2025',
      'what\'s new', 'what\'s happening', 'breaking', 'news', 'update', 'updates',
      'price', 'cost', 'stock', 'market', 'trending', 'popular',
      'reviews', 'rating', 'comparison', 'vs', 'versus',
      'release', 'launch', 'announcement', 'available'
    ]

    const lowerQuery = query.toLowerCase()
    return currentInfoKeywords.some(keyword => lowerQuery.includes(keyword))
  }

  isResearchQuery(query: string): boolean {
    const researchKeywords = [
      'research', 'study', 'analysis', 'report', 'survey', 'findings',
      'comprehensive', 'detailed', 'in-depth', 'thorough', 'complete',
      'how to', 'guide', 'tutorial', 'explain', 'understand',
      'compare', 'pros and cons', 'advantages', 'disadvantages',
      'best practices', 'recommendations', 'suggestions'
    ]

    const lowerQuery = query.toLowerCase()
    return researchKeywords.some(keyword => lowerQuery.includes(keyword)) || query.length > 50
  }
}

export const searchHiveService = new SearchHiveService()