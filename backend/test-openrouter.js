const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
require('dotenv').config();

console.log('Testing OpenRouter configuration...');
console.log('API Key exists:', !!process.env.OPENROUTER_API_KEY);
console.log('Model:', process.env.OPENROUTER_MODEL);

const chat = new ChatOpenAI(
  {
    model: process.env.OPENROUTER_MODEL || 'qwen/qwen3-30b-a3b-instruct-2507',
    temperature: 0.8,
    streaming: true,
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://lotus-backend.vercel.app',
      'X-Title': 'AI Chat App',
    },
  },
);

async function test() {
  try {
    console.log('Testing LLM...');
    const response = await chat.invoke([
      new SystemMessage("You are a helpful assistant."),
      new HumanMessage("Hello, how are you?"),
    ]);
    console.log('Success:', response.content);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();