// Performance test for the optimized agent
import { aiAgent } from './agent'
import { fastAIAgent } from './agent-fast'
import { responseCache } from './response-cache'

async function testPerformance() {
  console.log('🚀 Testing agent performance optimizations...\n')
  
  const testQueries = [
    'hi',                                    // Simple greeting
    'hello',                                 // Another greeting
    'what is 2+2',                          // Simple math
    'how are you',                          // Personal question
    'what time is it',                      // Temporal question
    'tell me about AI',                     // Information request
    'what is machine learning',             // Definition
    'how to code in python',                // How-to question
    'latest AI news',                       // Requires search
    'compare python vs javascript'          // Comparison
  ]
  
  console.log('Testing original agent:')
  console.log('=' .repeat(50))
  
  for (const query of testQueries) {
    const startTime = Date.now()
    try {
      const result = await aiAgent.processMessage(query, [])
      const duration = Date.now() - startTime
      
      console.log(`Query: "${query}"`)
      console.log(`Response: ${result.content.substring(0, 100)}...`)
      console.log(`Duration: ${duration}ms`)
      console.log(`Metadata:`, result.metadata)
      console.log('-' .repeat(30))
    } catch (error) {
      console.log(`❌ Error with "${query}":`, error)
    }
  }
  
  console.log('\n\nTesting fast agent:')
  console.log('=' .repeat(50))
  
  for (const query of testQueries) {
    const startTime = Date.now()
    try {
      const result = await fastAIAgent.processMessage(query, [])
      const duration = Date.now() - startTime
      
      console.log(`Query: "${query}"`)
      console.log(`Response: ${result.content.substring(0, 100)}...`)
      console.log(`Duration: ${duration}ms`)
      console.log(`Metadata:`, result.metadata)
      console.log('-' .repeat(30))
    } catch (error) {
      console.log(`❌ Error with "${query}":`, error)
    }
  }
  
  console.log('\n\nTesting cache performance:')
  console.log('=' .repeat(50))
  
  // Test cache hits
  const cacheTestQueries = ['hi', 'hello', 'what is your name', 'thank you']
  
  for (const query of cacheTestQueries) {
    console.log(`Testing cache for: "${query}"`)
    
    // First call - should be cache miss or common query
    const startTime1 = Date.now()
    const result1 = responseCache.get(query)
    const duration1 = Date.now() - startTime1
    
    console.log(`First call: ${duration1}ms, Result: ${result1?.response || 'miss'}`)
    
    // Set in cache
    if (!result1) {
      responseCache.set(query, `Test response for ${query}`, 'test')
    }
    
    // Second call - should be cache hit
    const startTime2 = Date.now()
    const result2 = responseCache.get(query)
    const duration2 = Date.now() - startTime2
    
    console.log(`Second call: ${duration2}ms, Result: ${result2?.response || 'miss'}`)
    console.log(`Cache stats:`, responseCache.getStats())
    console.log('-' .repeat(30))
  }
  
  console.log('\n\nTesting streaming performance:')
  console.log('=' .repeat(50))
  
  for (const query of ['hi', 'what is AI', 'how are you']) {
    console.log(`Streaming test for: "${query}"`)
    const startTime = Date.now()
    let eventCount = 0
    
    try {
      for await (const event of aiAgent.streamMessage(query, [])) {
        eventCount++
        if (event.type === 'content') {
          console.log(`  Content: ${event.content?.substring(0, 50)}...`)
        } else if (event.type === 'complete') {
          console.log(`  Complete in ${Date.now() - startTime}ms`)
          console.log(`  Total events: ${eventCount}`)
          console.log(`  Metadata:`, event.metadata)
        }
      }
    } catch (error) {
      console.log(`❌ Streaming error:`, error)
    }
    
    console.log('-' .repeat(30))
  }
  
  console.log('\n🎯 Performance test completed!')
  console.log('Cache final stats:', responseCache.getStats())
}

// Run if executed directly
if (require.main === module) {
  testPerformance().catch(console.error)
}

export { testPerformance }