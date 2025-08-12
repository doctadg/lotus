// Simple test to verify agent is working and using tools
import { aiAgent } from './agent'

async function testAgent() {
  console.log('🧪 Testing agent with tool-triggering query...')
  
  const testQueries = [
    "What's the current weather in New York?",
    "Tell me the latest AI news from today",
    "What are the current Bitcoin prices?",
    "Research the latest developments in quantum computing"
  ]
  
  for (const query of testQueries) {
    console.log('\n📝 Testing query:', query)
    console.log('=' .repeat(50))
    
    let eventCount = 0
    for await (const event of aiAgent.streamMessage(query, [])) {
      eventCount++
      console.log(`Event #${eventCount}:`, event.type, event.content?.substring(0, 100))
      
      // Stop after seeing some events
      if (eventCount > 20) break
    }
    
    console.log(`Total events received: ${eventCount}`)
    break // Just test one query
  }
}

// Run if executed directly
if (require.main === module) {
  testAgent().catch(console.error)
}

export { testAgent }