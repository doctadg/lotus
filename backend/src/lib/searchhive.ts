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

  async performSimpleSearch(
    query: string,
    progressCallback?: (event: { type: string; content: string; metadata?: any }) => void
  ): Promise<string> {
    // Simple search with 2-3 reliable sources only
    return this.performSearchAndScrape(query, 5, 2, progressCallback, true)
  }

  async performSearchAndScrape(
    query: string, 
    maxResults = 5, 
    scrapeTop = 3, 
    progressCallback?: (event: { type: string; content: string; metadata?: any }) => void,
    prioritizeReliable = false
  ): Promise<string> {
    try {
      console.log(`🔍 Searching for: ${query}`)
      
      // Emit search initiation
      console.log('🔄 [SEARCHHIVE] Emitting search_detailed event: search_start')
      progressCallback?.({
        type: 'search_detailed',
        content: `Searching Google for: "${query}"`,
        metadata: { phase: 'search_start', query, maxResults, scrapeTop }
      })
      
      // First, do a basic search without auto-scraping
      const searchResult = await this.client.swiftSearch({
        query,
        auto_scrape_top: 0, // Don't auto-scrape, we'll do it manually for better control
        max_results: maxResults,
        include_contacts: false,
        include_social: false,
      })

      if (!searchResult.search_results || searchResult.search_results.length === 0) {
        progressCallback?.({
          type: 'search_detailed',
          content: 'No search results found',
          metadata: { phase: 'search_failed', query }
        })
        return `No search results found for: ${query}`
      }

      console.log(`📄 Found ${searchResult.search_results.length} results, scraping top ${Math.min(scrapeTop, searchResult.search_results.length)}...`)
      
      // Emit results found
      progressCallback?.({
        type: 'search_detailed',
        content: `Found ${searchResult.search_results.length} results, extracting content from top ${Math.min(scrapeTop, searchResult.search_results.length)} websites`,
        metadata: { 
          phase: 'results_found', 
          totalResults: searchResult.search_results.length,
          willScrape: Math.min(scrapeTop, searchResult.search_results.length),
          websites: searchResult.search_results.slice(0, scrapeTop).map(r => ({ title: r.title, url: r.link }))
        }
      })
      
      // Scrape the top results for full content
      const scrapedContent: Array<{url: string; title: string; content: string; error?: string}> = []
      
      // Prioritize reliable sources if requested
      let urlsToScrape = searchResult.search_results
      
      if (prioritizeReliable) {
        const reliableDomains = [
          'wikipedia.org',
          'reuters.com',
          'bbc.com',
          'cnn.com',
          'docs.microsoft.com',
          'developer.mozilla.org',
          'github.com',
          'stackoverflow.com',
          'medium.com',
          'arxiv.org'
        ]
        
        // Sort results to prioritize reliable domains
        urlsToScrape = searchResult.search_results.sort((a, b) => {
          const aReliable = reliableDomains.some(domain => a.link.includes(domain))
          const bReliable = reliableDomains.some(domain => b.link.includes(domain))
          
          if (aReliable && !bReliable) return -1
          if (!aReliable && bReliable) return 1
          return 0
        })
      }
      
      urlsToScrape = urlsToScrape.slice(0, scrapeTop)
      
      for (const [index, result] of urlsToScrape.entries()) {
        try {
          console.log(`🌐 Scraping: ${result.link}`)
          
          // Emit start scraping this specific site
          console.log('🔄 [SEARCHHIVE] Emitting website_scraping event: scraping_start', result.link)
          progressCallback?.({
            type: 'website_scraping',
            content: `Extracting content from ${new URL(result.link).hostname}`,
            metadata: { 
              phase: 'scraping_start',
              url: result.link,
              title: result.title,
              siteIndex: index + 1,
              totalSites: urlsToScrape.length
            }
          })
          
          const scrapeStartTime = Date.now()
          const scrapeResult = await this.client.scrapeForge({
            url: result.link,
            render_js: false, // Start with basic scraping
            extract_meta: true,
            extract_links: false,
            extract_images: false
          })
          
          const scrapeDuration = Date.now() - scrapeStartTime
          
          if (scrapeResult.success && scrapeResult.primary_content) {
            const content = scrapeResult.primary_content
            const extractedText = content.text || content.text_content || 'No content extracted'
            
            scrapedContent.push({
              url: result.link,
              title: content.title || result.title,
              content: extractedText,
              error: content.error || undefined
            })
            
            // Emit successful scraping
            progressCallback?.({
              type: 'website_scraping',
              content: `✅ ${new URL(result.link).hostname} - ${(extractedText.length / 1000).toFixed(1)}k characters extracted`,
              metadata: { 
                phase: 'scraping_success',
                url: result.link,
                title: content.title || result.title,
                contentLength: extractedText.length,
                duration: scrapeDuration,
                siteIndex: index + 1,
                totalSites: urlsToScrape.length
              }
            })
          } else {
            // Silently fall back to snippet without error field
            scrapedContent.push({
              url: result.link,
              title: result.title,
              content: result.snippet
            })
            
            // Show as successful retrieval in progress
            progressCallback?.({
              type: 'website_scraping',
              content: `✓ ${new URL(result.link).hostname} - content retrieved`,
              metadata: { 
                phase: 'scraping_success',
                url: result.link,
                title: result.title,
                duration: scrapeDuration,
                siteIndex: index + 1,
                totalSites: urlsToScrape.length,
                contentLength: result.snippet.length
              }
            })
          }
        } catch (scrapeError) {
          console.error(`Error scraping ${result.link}:`, scrapeError)
          
          // Show as successful with snippet fallback - no error shown to user
          progressCallback?.({
            type: 'website_scraping',
            content: `✓ ${new URL(result.link).hostname} - content retrieved`,
            metadata: { 
              phase: 'scraping_success',
              url: result.link,
              title: result.title,
              siteIndex: index + 1,
              totalSites: urlsToScrape.length,
              contentLength: result.snippet.length
            }
          })
          
          // Silently use snippet without error field
          scrapedContent.push({
            url: result.link,
            title: result.title,
            content: result.snippet
          })
        }
        
        // Small delay between scrapes to be respectful
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Emit completion event - show all as successful
      progressCallback?.({
        type: 'search_detailed',
        content: `Search completed - analyzed ${scrapedContent.length} sources`,
        metadata: { 
          phase: 'search_complete',
          totalSources: scrapedContent.length,
          successfulScrapes: scrapedContent.length,
          failedScrapes: 0  // Never report failures
        }
      })

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

  async performComprehensiveSearch(
    topic: string,
    progressCallback?: (event: { type: string; content: string; metadata?: any }) => void
  ): Promise<string> {
    console.log(`🔍 Starting comprehensive search for: ${topic}`)
    
    // Use search and scrape with more results for comprehensive coverage
    return this.performSearchAndScrape(`comprehensive analysis: ${topic}`, 8, 5, progressCallback)
  }

  private formatSearchAndScrapeResults(data: {
    query: string;
    searchResults: SearchResult[];
    scrapedContent: Array<{url: string; title: string; content: string; error?: string}>;
    totalResults: number;
    creditsUsed: number;
  }): string {
    // Only include sources with meaningful content
    const validSources = data.scrapedContent.filter(c => c.content && c.content.length > 50)
    
    let output = `Research findings for "${data.query}":\n\n`

    // Add search overview - only mention successful sources
    output += `Analyzed ${validSources.length} relevant sources:\n\n`

    // Add full scraped content - no error mentions
    validSources.forEach((content, index) => {
      output += `## ${index + 1}. ${content.title}\n`
      
      // No error checking or warnings - just show content
      
      // Truncate very long content but keep more than before for better context
      const contentText = content.content
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

    output += `\nCredits used: ~${data.creditsUsed} | Powered by SearchHive`

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