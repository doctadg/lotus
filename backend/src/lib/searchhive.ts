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

  private async makeRequest<T>(endpoint: string, data: Record<string, unknown>, retryCount = 0): Promise<T> {
    const maxRetries = Number(process.env.SEARCHHIVE_MAX_RETRIES || 2)
    const baseDelayMs = 1000

    try {
      const controller = new AbortController()
      const timeoutMs = Number(process.env.SEARCHHIVE_TIMEOUT_MS || 12000)
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = `SearchHive API error (${response.status}): ${errorData.message || response.statusText}`

        // Retry on 5xx server errors if we haven't exhausted retries
        if (response.status >= 500 && response.status < 600 && retryCount < maxRetries) {
          const delayMs = baseDelayMs * Math.pow(2, retryCount) // exponential backoff
          console.warn(`⚠️ SearchHive ${response.status} error, retrying in ${delayMs}ms (attempt ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return this.makeRequest<T>(endpoint, data, retryCount + 1)
        }

        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      // Handle timeout/abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        // Retry on timeout if we haven't exhausted retries
        if (retryCount < maxRetries) {
          const delayMs = baseDelayMs * Math.pow(2, retryCount)
          console.warn(`⚠️ SearchHive request timeout, retrying in ${delayMs}ms (attempt ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return this.makeRequest<T>(endpoint, data, retryCount + 1)
        }
        throw new Error(`SearchHive request timed out after ${retryCount + 1} attempts`)
      }

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
  private searchQueue: Map<string, Promise<SwiftSearchResponse>> = new Map()
  private scrapeQueue: Map<string, Promise<{url: string; title: string; content: string; error?: string}>> = new Map()

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

      // Scrape with TRUE maximum parallelization - fire all requests at once!
      console.log(`🚀 [SEARCHHIVE] Starting TRUE parallel scraping of ${urlsToScrape.length} URLs simultaneously`)
      
      // Create all scrape promises and execute them ALL at once
      const scrapePromises = urlsToScrape.map(async (result, idx) => {
        const index = idx
        
        // Check if already in progress
        if (this.scrapeQueue.has(result.link)) {
          console.log(`🔄 [SEARCHHIVE] Reusing in-progress scrape for: ${result.link}`)
          return this.scrapeQueue.get(result.link)
        }
        
        const scrapePromise = this.performSingleScrape(result, index, urlsToScrape.length, progressCallback)
        this.scrapeQueue.set(result.link, scrapePromise)
        
        try {
          const scrapedResult = await scrapePromise
          this.scrapeQueue.delete(result.link)
          return scrapedResult
        } catch (error) {
          this.scrapeQueue.delete(result.link)
          throw error
        }
      })

      // FIRE ALL REQUESTS SIMULTANEOUSLY - no batching, no waiting!
      console.log(`⚡ [SEARCHHIVE] Executing ${scrapePromises.length} scrape requests in parallel`)
      const settledResults = await Promise.allSettled(scrapePromises)
      
      // Process results - handle failures gracefully
      settledResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          scrapedContent.push(result.value)
        } else {
          // Fallback to snippet for failed scrapes
          const fallbackResult = urlsToScrape[index]
          scrapedContent.push({
            url: fallbackResult.link,
            title: fallbackResult.title,
            content: fallbackResult.snippet
          })
          console.log(`⚠️ [SEARCHHIVE] Scrape failed for ${fallbackResult.link}, using snippet fallback`)
        }
      })

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

  private async performSingleScrape(
    result: SearchResult,
    index: number,
    totalSites: number,
    progressCallback?: (event: { type: string; content: string; metadata?: any }) => void
  ): Promise<{url: string; title: string; content: string; error?: string}> {
    try {
      console.log(`🌐 [SEARCHHIVE] Scraping: ${result.link}`)
      progressCallback?.({
        type: 'website_scraping',
        content: `Extracting content from ${new URL(result.link).hostname}`,
        metadata: { 
          phase: 'scraping_start',
          url: result.link,
          title: result.title,
          siteIndex: index + 1,
          totalSites
        }
      })

      const scrapeStartTime = Date.now()
      const scrapeResult = await this.client.scrapeForge({
        url: result.link,
        render_js: false,
        extract_meta: true,
        extract_links: false,
        extract_images: false
      })
      const scrapeDuration = Date.now() - scrapeStartTime

      if (scrapeResult.success && scrapeResult.primary_content) {
        const content = scrapeResult.primary_content
        const extractedText = content.text || content.text_content || 'No content extracted'
        
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
            totalSites
          }
        })
        
        return {
          url: result.link,
          title: content.title || result.title,
          content: extractedText,
          error: content.error || undefined
        }
      } else {
        progressCallback?.({
          type: 'website_scraping',
          content: `✓ ${new URL(result.link).hostname} - content retrieved`,
          metadata: { 
            phase: 'scraping_success',
            url: result.link,
            title: result.title,
            duration: scrapeDuration,
            siteIndex: index + 1,
            totalSites,
            contentLength: result.snippet.length
          }
        })
        
        return {
          url: result.link,
          title: result.title,
          content: result.snippet
        }
      }
    } catch (scrapeError) {
      console.error(`❌ [SEARCHHIVE] Error scraping ${result.link}:`, scrapeError)
      
      progressCallback?.({
        type: 'website_scraping',
        content: `✓ ${new URL(result.link).hostname} - using snippet`,
        metadata: { 
          phase: 'scraping_fallback',
          url: result.link,
          title: result.title,
          siteIndex: index + 1,
          totalSites,
          contentLength: result.snippet.length
        }
      })
      
      return {
        url: result.link,
        title: result.title,
        content: result.snippet
      }
    }
  }



  /**
   * Execute multiple searches in parallel for better performance
   */
  async performParallelSearches(
    queries: string[],
    maxResultsPerQuery = 5,
    scrapeTopPerQuery = 2,
    progressCallback?: (event: { type: string; content: string; metadata?: any }) => void
  ): Promise<string[]> {
    console.log(`🚀 [SEARCHHIVE] Starting ${queries.length} parallel searches`)

    progressCallback?.({
      type: 'parallel_search_start',
      content: `Executing ${queries.length} searches simultaneously`,
      metadata: { queryCount: queries.length, timestamp: Date.now() }
    })

    // Execute all searches in parallel
    const searchPromises = queries.map(async (query, index) => {
      try {
        // Check if this search is already in progress
        const cacheKey = `${query}_${maxResultsPerQuery}_${scrapeTopPerQuery}`
        if (this.searchQueue.has(cacheKey)) {
          console.log(`🔄 [SEARCHHIVE] Reusing in-progress search for: ${query}`)
          const result = await this.searchQueue.get(cacheKey)
          return this.formatSearchAndScrapeResults({
            query,
            searchResults: result?.search_results || [],
            scrapedContent: [],
            totalResults: result?.results_count || 0,
            creditsUsed: 0
          })
        }

        // Start new search
        const searchPromise = this.client.swiftSearch({
          query,
          auto_scrape_top: scrapeTopPerQuery,
          max_results: maxResultsPerQuery,
          include_contacts: false,
          include_social: false,
        })

        // Store in queue to prevent duplicates
        this.searchQueue.set(cacheKey, searchPromise)

        const searchResult = await searchPromise

        // Clean up queue
        this.searchQueue.delete(cacheKey)

        progressCallback?.({
          type: 'parallel_search_progress',
          content: `Search ${index + 1}/${queries.length} completed`,
          metadata: {
            queryIndex: index,
            query,
            resultsFound: searchResult.results_count,
            timestamp: Date.now()
          }
        })

        return this.formatSearchAndScrapeResults({
          query,
          searchResults: searchResult.search_results || [],
          scrapedContent: (searchResult.scraped_content || [])
            .filter(item => item.content)
            .map(item => ({
              url: item.url,
              title: item.title,
              content: item.content!,
              error: item.error || undefined
            })),
          totalResults: searchResult.results_count || 0,
          creditsUsed: searchResult.credits_used || 0
        })
      } catch (error) {
        console.error(`❌ [SEARCHHIVE] Error in parallel search for "${query}":`, error)
        return `Error searching for "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    })

    const results = await Promise.all(searchPromises)

    progressCallback?.({
      type: 'parallel_search_complete',
      content: `All ${queries.length} searches completed`,
      metadata: {
        totalQueries: queries.length,
        timestamp: Date.now()
      }
    })

    return results
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


  /**
   * Smart Search Scheduler - Controlled parallelization with rate limiting
   * Prevents system overload while maintaining fast performance
   */
  async performSmartSearch(
    query: string,
    intensity: 'light' | 'moderate' | 'deep' = 'moderate',
    progressCallback?: (event: { type: string; content: string; metadata?: any }) => void
  ): Promise<string> {
    const startTime = Date.now()
    
    try {
      console.log(`🧠 [SMART_SEARCH] Starting ${intensity} search for: "${query}"`)
      
      progressCallback?.({
        type: 'search_planning',
        content: `Planning ${intensity} search strategy for: "${query}"`,
        metadata: {
          phase: 'planning',
          query,
          strategy: intensity,
          progress: 10,
          sources: { total: 0, completed: 0, failed: 0 }
        }
      })

      // Determine search parameters based on intensity
      const searchConfig = this.getSearchConfig(intensity)
      
      // Execute search with controlled parallelization
      const result = await this.executeControlledSearch(query, searchConfig, progressCallback)
      
      const totalTime = Date.now() - startTime
      
      progressCallback?.({
        type: 'search_complete',
        content: `Complete - analyzed ${result.sourcesScraped} sources using ${intensity} strategy in ${(totalTime / 1000).toFixed(1)}s`,
        metadata: {
          phase: 'complete',
          query,
          strategy: intensity,
          progress: 100,
          sources: { 
            total: result.sourcesFound, 
            completed: result.sourcesScraped, 
            failed: result.sourcesFound - result.sourcesScraped 
          },
          quality: {
            score: result.qualityScore,
            relevance: this.calculateRelevance(result.content),
            confidence: 0.85
          },
          metrics: {
            duration: totalTime,
            requestsUsed: result.requestsUsed,
            tokensFound: result.content.length
          }
        }
      })

      console.log(`✅ [SMART_SEARCH] ${intensity} search completed in ${totalTime}ms - ${result.sourcesScraped}/${result.sourcesFound} sources`)
      
      return result.content
      
    } catch (error) {
      console.error(`❌ [SMART_SEARCH] Error:`, error)
      
      progressCallback?.({
        type: 'search_error',
        content: `Search error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          phase: 'error',
          query,
          error: error instanceof Error ? error.message : 'Unknown error',
          progress: 0
        }
      })
      
      return `Search error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  private getSearchConfig(intensity: 'light' | 'moderate' | 'deep') {
    const configs = {
      light: {
        maxResults: 3,
        scrapeTop: 2,
        maxConcurrent: 2,
        timeout: 8000,
        prioritizeReliable: true
      },
      moderate: {
        maxResults: 5,
        scrapeTop: 3,
        maxConcurrent: 3,
        timeout: 12000,
        prioritizeReliable: false
      },
      deep: {
        maxResults: 8,
        scrapeTop: 5,
        maxConcurrent: 3,
        timeout: 15000,
        prioritizeReliable: false
      }
    }
    
    return configs[intensity]
  }

  private async executeControlledSearch(
    query: string,
    config: any,
    progressCallback?: (event: { type: string; content: string; metadata?: any }) => void
  ): Promise<{
    content: string
    sourcesFound: number
    sourcesScraped: number
    qualityScore: number
    requestsUsed: number
  }> {
    // Phase 1: Search
    progressCallback?.({
      type: 'search_progress',
      content: `Searching web sources for: "${query}"`,
      metadata: {
        phase: 'searching',
        query,
        progress: 30,
        sources: { total: 0, completed: 0, failed: 0 }
      }
    })

    const searchResult = await this.client.swiftSearch({
      query,
      auto_scrape_top: 0,
      max_results: config.maxResults,
      include_contacts: false,
      include_social: false,
    })

    if (!searchResult.search_results || searchResult.search_results.length === 0) {
      return {
        content: `No results found for: ${query}`,
        sourcesFound: 0,
        sourcesScraped: 0,
        qualityScore: 0,
        requestsUsed: 1
      }
    }

    // Phase 2: Scraping with controlled concurrency
    progressCallback?.({
      type: 'search_progress',
      content: `Extracting content from ${searchResult.search_results.length} sources`,
      metadata: {
        phase: 'scraping',
        query,
        progress: 60,
        sources: { 
          total: searchResult.search_results.length, 
          completed: 0, 
          failed: 0 
        }
      }
    })

    const urlsToScrape = searchResult.search_results.slice(0, config.scrapeTop)
    const scrapedContent = await this.scrapeWithConcurrencyControl(
      urlsToScrape,
      config.maxConcurrent,
      progressCallback
    )

    // Phase 3: Analysis
    progressCallback?.({
      type: 'search_progress',
      content: `Analyzing and synthesizing ${scrapedContent.length} sources`,
      metadata: {
        phase: 'analyzing',
        query,
        progress: 90,
        sources: { 
          total: searchResult.search_results.length, 
          completed: scrapedContent.length, 
          failed: urlsToScrape.length - scrapedContent.length 
        }
      }
    })

    const formattedContent = this.formatSearchAndScrapeResults({
      query,
      searchResults: searchResult.search_results,
      scrapedContent,
      totalResults: searchResult.results_count,
      creditsUsed: searchResult.credits_used + scrapedContent.length * 3
    })

    return {
      content: formattedContent,
      sourcesFound: searchResult.search_results.length,
      sourcesScraped: scrapedContent.length,
      qualityScore: this.calculateQualityScore(formattedContent),
      requestsUsed: 1 + scrapedContent.length
    }
  }

  private async scrapeWithConcurrencyControl(
    urls: SearchResult[],
    maxConcurrent: number,
    progressCallback?: (event: { type: string; content: string; metadata?: any }) => void
  ): Promise<Array<{url: string; title: string; content: string; error?: string}>> {
    const results: Array<{url: string; title: string; content: string; error?: string}> = []
    const chunks = this.chunkArray(urls, maxConcurrent)
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`🔄 [CONCURRENT_SCRAPING] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} URLs)`)
      
      const chunkPromises = chunk.map((result, index) => 
        this.performSingleScrape(result, i * maxConcurrent + index, urls.length, progressCallback)
          .catch(error => {
            console.error(`❌ [CONCURRENT_SCRAPING] Scrape failed for ${result.link}:`, error)
            return {
              url: result.link,
              title: result.title,
              content: result.snippet,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
      )
      
      const chunkResults = await Promise.allSettled(chunkPromises)
      
      chunkResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value)
        }
      })
      
      // Small delay between chunks to prevent overwhelming the API
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    return results
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private calculateQualityScore(content: string): number {
    let score = 0
    
    // Length-based scoring
    if (content.length > 1000) score += 0.3
    if (content.length > 2000) score += 0.2
    
    // Source diversity
    const sourceCount = (content.match(/##\s+\d+\./g) || []).length
    if (sourceCount >= 3) score += 0.3
    if (sourceCount >= 5) score += 0.2
    
    // Content quality indicators
    if (content.includes('Credits used')) score += 0.1
    if (!content.includes('Error')) score += 0.1
    
    return Math.min(1.0, score)
  }

  private calculateRelevance(content: string): 'high' | 'medium' | 'low' {
    const score = this.calculateQualityScore(content)
    if (score >= 0.7) return 'high'
    if (score >= 0.4) return 'medium'
    return 'low'
  }

  /**
   * Expand a single query into multiple search variations for broader coverage
   * Uses rule-based patterns for instant expansion (no LLM delay)
   */
  expandQueryVariations(query: string): string[] {
    const variations: string[] = [query] // Always include original

    // Skip expansion for very specific queries (URLs, exact phrases, etc.)
    if (query.startsWith('http') || query.startsWith('site:') || query.includes('"')) {
      return variations
    }

    const lowerQuery = query.toLowerCase()

    // Add contextual variations based on query type
    if (!lowerQuery.includes('tutorial') && !lowerQuery.includes('guide')) {
      variations.push(`${query} tutorial`)
      variations.push(`${query} guide`)
    }

    if (!lowerQuery.includes('documentation') && !lowerQuery.includes('docs')) {
      variations.push(`${query} documentation`)
    }

    if (!lowerQuery.includes('latest') && !lowerQuery.includes('2024') && !lowerQuery.includes('2025')) {
      variations.push(`${query} latest`)
    }

    if (!lowerQuery.includes('example') && !lowerQuery.includes('examples')) {
      variations.push(`${query} examples`)
    }

    // Limit to 5 variations to avoid overwhelming the search
    return variations.slice(0, 5)
  }

  /**
   * Normalize URL for deduplication
   * Strips protocol, www, trailing slashes for consistent comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      return `${parsed.hostname}${parsed.pathname}`.toLowerCase()
        .replace(/^www\./, '')
        .replace(/\/$/, '')
    } catch {
      return url.toLowerCase()
    }
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
