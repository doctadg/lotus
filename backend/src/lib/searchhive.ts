import { config } from 'dotenv'
import path from 'path'

config({ path: path.join(process.cwd(), '.env') })

export interface SwiftSearchOptions {
  query: string
  max_results?: number
  auto_scrape_top?: number
  include_contacts?: boolean
  include_social?: boolean
  country?: string
  language?: string
  time_range?: string
  safe_search?: string
  result_type?: string
}

export interface ScrapeForgeOptions {
  url: string
  render_js?: boolean
  wait_for?: string
  wait_time?: number
  extract_links?: boolean
  extract_images?: boolean
  extract_schema?: boolean
  extract_meta?: boolean
  screenshot?: boolean
  proxy_type?: string
  proxy_country?: string
  custom_headers?: Record<string, string>
  cookies?: Record<string, string>
}


export interface SearchResult {
  title: string
  link: string
  snippet: string
  position: number
  date?: string
}

export interface ScrapedContent {
  url: string
  title: string
  text?: string
  content?: string
  text_content?: string
  error: string | null
  links?: Array<{ href: string; text: string; title?: string }>
  images?: Array<{ src: string; alt?: string; width?: number; height?: number }>
  schema_data?: Record<string, unknown>[]
  meta_data?: Record<string, unknown>
  screenshot_url?: string
  load_time?: number
  status_code?: number
  final_url?: string
}

export interface ContactInfo {
  type: string
  value: string
  name?: string
  company?: string
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
  request_id: string
}

export interface ScrapeForgeResponse {
  url: string
  primary_content: ScrapedContent
  discovered_links?: ScrapedContent[]
  contacts?: ContactInfo[]
  credits_used: number
  remaining_credits: number
  success: boolean
  request_id?: string
}


export class SearchHiveClient {
  private apiKey: string
  private baseUrl: string = 'https://www.searchhive.dev/api/v1'

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
          'Authorization': `Bearer ${this.apiKey}`,
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
    const params: Record<string, unknown> = {
      query: options.query,
      max_results: options.max_results || 10,
      auto_scrape_top: options.auto_scrape_top || 3,
      include_contacts: options.include_contacts || false,
      include_social: options.include_social || false,
    }

    // Add optional parameters if provided
    if (options.country) params.country = options.country
    if (options.language) params.language = options.language
    if (options.time_range) params.time_range = options.time_range
    if (options.safe_search) params.safe_search = options.safe_search
    if (options.result_type) params.result_type = options.result_type

    return this.makeRequest<SwiftSearchResponse>('/swiftsearch', params)
  }

  async scrapeForge(options: ScrapeForgeOptions): Promise<ScrapeForgeResponse> {
    const params: Record<string, unknown> = {
      url: options.url,
      render_js: options.render_js || false,
      extract_meta: options.extract_meta !== false, // default true
    }

    // Add optional parameters if provided
    if (options.wait_for) params.wait_for = options.wait_for
    if (options.wait_time) params.wait_time = options.wait_time
    if (options.extract_links) params.extract_links = options.extract_links
    if (options.extract_images) params.extract_images = options.extract_images
    if (options.extract_schema) params.extract_schema = options.extract_schema
    if (options.screenshot) params.screenshot = options.screenshot
    if (options.proxy_type) params.proxy_type = options.proxy_type
    if (options.proxy_country) params.proxy_country = options.proxy_country
    if (options.custom_headers) params.custom_headers = options.custom_headers
    if (options.cookies) params.cookies = options.cookies

    return this.makeRequest<ScrapeForgeResponse>('/scrapeforge', params)
  }

}

export class SearchHiveService {
  private client: SearchHiveClient

  constructor() {
    this.client = new SearchHiveClient()
  }

  async performSearchAndScrape(query: string, maxResults = 5, scrapeTop = 3): Promise<string> {
    try {
      console.log(`🔍 Searching for: ${query}`)
      
      // First, do a basic search without auto-scraping
      const searchResult = await this.client.swiftSearch({
        query,
        auto_scrape_top: 0, // Don't auto-scrape, we'll do it manually for better control
        max_results: maxResults,
        include_contacts: false,
        include_social: false,
      })

      if (!searchResult.search_results || searchResult.search_results.length === 0) {
        return `No search results found for: ${query}`
      }

      console.log(`📄 Found ${searchResult.search_results.length} results, scraping top ${Math.min(scrapeTop, searchResult.search_results.length)}...`)
      
      // Scrape the top results for full content
      const scrapedContent: Array<{url: string; title: string; content: string; error?: string}> = []
      const urlsToScrape = searchResult.search_results.slice(0, scrapeTop)
      
      for (const result of urlsToScrape) {
        try {
          console.log(`🌐 Scraping: ${result.link}`)
          const scrapeResult = await this.client.scrapeForge({
            url: result.link,
            render_js: false, // Start with basic scraping
            extract_meta: true,
            extract_links: false,
            extract_images: false
          })
          
          if (scrapeResult.success && scrapeResult.primary_content) {
            const content = scrapeResult.primary_content
            scrapedContent.push({
              url: result.link,
              title: content.title || result.title,
              content: content.text || content.text_content || 'No content extracted',
              error: content.error || undefined
            })
          } else {
            scrapedContent.push({
              url: result.link,
              title: result.title,
              content: result.snippet,
              error: 'Failed to scrape full content'
            })
          }
        } catch (scrapeError) {
          console.error(`Error scraping ${result.link}:`, scrapeError)
          scrapedContent.push({
            url: result.link,
            title: result.title,
            content: result.snippet,
            error: scrapeError instanceof Error ? scrapeError.message : 'Scraping failed'
          })
        }
        
        // Small delay between scrapes to be respectful
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      return this.formatSearchAndScrapeResults({
        query,
        searchResults: searchResult.search_results,
        scrapedContent,
        totalResults: searchResult.results_count,
        creditsUsed: searchResult.credits_used + scrapedContent.length * 3 // Estimate credits
      })
    } catch (error) {
      console.error('Search and scrape error:', error)
      return `Error performing search and scrape: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  async performComprehensiveSearch(topic: string): Promise<string> {
    console.log(`🔍 Starting comprehensive search for: ${topic}`)
    
    // Use search and scrape with more results for comprehensive coverage
    return this.performSearchAndScrape(`comprehensive analysis: ${topic}`, 8, 5)
  }

  private formatSearchAndScrapeResults(data: {
    query: string;
    searchResults: SearchResult[];
    scrapedContent: Array<{url: string; title: string; content: string; error?: string}>;
    totalResults: number;
    creditsUsed: number;
  }): string {
    let output = `Search Results for "${data.query}":\n\n`

    // Add search overview
    output += `Found ${data.totalResults} results, scraped ${data.scrapedContent.length} pages for full content:\n\n`

    // Add full scraped content
    data.scrapedContent.forEach((content, index) => {
      output += `## ${index + 1}. ${content.title}\n`
      
      if (content.error && content.error !== 'No content extracted') {
        output += `⚠️ Scraping issue: ${content.error}\n`
      }
      
      // Truncate very long content but keep more than before for better context
      const contentText = content.content || 'No content available'
      const summary = contentText.length > 800 
        ? contentText.substring(0, 800) + '...\n\n[Content truncated - full article available at source]' 
        : contentText
      
      output += `${summary}\n\n**Source:** ${content.url}\n\n`
      output += `---\n\n`
    })

    // Add remaining search results that weren't scraped
    const remainingResults = data.searchResults.slice(data.scrapedContent.length)
    if (remainingResults.length > 0) {
      output += `## Additional Search Results:\n\n`
      remainingResults.forEach((result, index) => {
        output += `${data.scrapedContent.length + index + 1}. **${result.title}**\n`
        output += `   ${result.snippet}\n`
        output += `   Link: ${result.link}\n\n`
      })
    }

    output += `\n📊 Credits used: ~${data.creditsUsed} | Powered by SearchHive`

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

  isComprehensiveQuery(query: string): boolean {
    const comprehensiveKeywords = [
      'research', 'study', 'analysis', 'report', 'survey', 'findings',
      'comprehensive', 'detailed', 'in-depth', 'thorough', 'complete',
      'how to', 'guide', 'tutorial', 'explain', 'understand',
      'compare', 'pros and cons', 'advantages', 'disadvantages',
      'best practices', 'recommendations', 'suggestions'
    ]

    const lowerQuery = query.toLowerCase()
    return comprehensiveKeywords.some(keyword => lowerQuery.includes(keyword)) || query.length > 50
  }
}

export const searchHiveService = new SearchHiveService()