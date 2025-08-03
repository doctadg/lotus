const { ChatOpenAI } = require('@langchain/openai');
require('dotenv').config({ path: './backend/.env' });

console.log('Testing OpenRouter configuration...');
console.log('API Key exists:', !!process.env.OPENROUTER_API_KEY);
console.log('Model:', process.env.OPENROUTER_MODEL);

const llm = new ChatOpenAI({
  model: process.env.OPENROUTER_MODEL || 'qwen/qwen3-30b-a3b-instruct-2507',
  temperature: 0.7,
  maxTokens: 2048,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://lotus-backend.vercel.app',
      'X-Title': 'AI Chat App'
    }
  }
});

async function test() {
  try {
    console.log('Testing LLM...');
    const response = await llm.invoke('Hello! Say hi back.');
    console.log('Success:', response.content);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();