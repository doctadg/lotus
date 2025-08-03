# AI Chat Application

A modern, ChatGPT-like chat application with streaming support, built with Next.js backend and React Native mobile app.

## 🎯 Features

- **Real-time Streaming**: Messages stream in real-time as the AI generates responses
- **ChatGPT-like UI**: Clean, modern interface with smooth animations
- **Sidebar Navigation**: Slide-out menu for chat history management
- **Cross-Platform Mobile**: React Native app for iOS and Android
- **Serverless Backend**: Next.js API routes with Prisma and PostgreSQL
- **AI Agent Integration**: LangChain agent with OpenRouter (Qwen model)
- **Function Calling**: Extensible AI agent with tool support

## 🏗 Architecture

### Backend (Next.js + Prisma + LangChain)
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM (Cloud hosted)
- **AI Integration**: LangChain with OpenRouter API
- **Authentication**: Simple token-based auth
- **Deployment**: Vercel-ready serverless functions

### Mobile App (Expo React Native)
- **Framework**: Expo SDK 50+ with TypeScript
- **UI**: Custom components with React Native Reanimated
- **Navigation**: Animated sidebar navigation
- **Streaming**: Server-Sent Events for real-time messaging
- **State Management**: React hooks and context

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (for mobile development)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment variables are already configured** with:
   - Prisma Cloud PostgreSQL database
   - OpenRouter API key
   - Agent configuration

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:3000`

### Mobile App Setup

1. **Navigate to mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Expo development server**:
   ```bash
   npm start
   ```

4. **Run on device/simulator**:
   - **iOS**: `npm run ios` (requires macOS and Xcode)
   - **Android**: `npm run android` (requires Android Studio)
   - **Web**: `npm run web`

## 📱 Mobile App Features

### Streaming Chat Interface
- Real-time message streaming with typing indicators
- Smooth animations for message appearance
- Auto-scrolling during message generation
- Optimistic UI updates

### Sidebar Navigation
- Animated slide-out menu
- Chat history management
- Create new chats
- Delete existing chats
- Smooth transitions and gestures

### Message Components
- User and AI message bubbles
- Avatar indicators
- Animated typing indicator with bouncing dots
- Timestamp display

## 🔧 API Endpoints

### Chat Management
- `GET /api/chat` - List user chats
- `POST /api/chat` - Create new chat
- `GET /api/chat/[chatId]` - Get chat details
- `DELETE /api/chat/[chatId]` - Delete chat

### Messaging
- `GET /api/chat/[chatId]/messages` - Get chat messages
- `POST /api/chat/[chatId]/messages` - Send message (non-streaming)
- `POST /api/chat/[chatId]/stream` - Send message with streaming response

### User Management
- `GET /api/user/profile` - Get user profile
- `POST /api/user/profile` - Create/update user

### System
- `GET /api/health` - Health check endpoint

## 🎨 UI Components

### Backend Components
- **Prisma Schema**: User, Chat, Message models
- **LangChain Agent**: AI agent with function calling
- **Streaming Routes**: Server-Sent Events implementation
- **Authentication**: Simple token-based system

### Mobile Components
- **ChatScreen**: Main chat interface with streaming
- **Sidebar**: Animated navigation menu
- **ChatMessage**: Individual message bubbles
- **TypingIndicator**: Animated typing dots
- **API Service**: Streaming and REST API client

## 🔄 Streaming Implementation

### Backend Streaming
```typescript
// Server-Sent Events with chunked responses
for await (const chunk of aiAgent.streamMessage(content, history)) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    type: 'ai_chunk',
    data: { content: chunk }
  })}\n\n`))
}
```

### Mobile Streaming
```typescript
// AsyncGenerator for handling streaming responses
for await (const event of apiService.sendMessageStream(chatId, { content })) {
  switch (event.type) {
    case 'ai_chunk':
      // Update message content in real-time
      break
    case 'ai_typing':
      // Show/hide typing indicator
      break
  }
}
```

## 🛠 Development

### Backend Development
```bash
cd backend
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Mobile Development
```bash
cd mobile
npm start          # Start Expo development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
```

### Database Management
```bash
cd backend
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema changes
npx prisma studio      # Open Prisma studio
```

## 🌐 Deployment

### Backend (Vercel)
1. Connect your repository to Vercel
2. Environment variables are already configured
3. Deploy with automatic builds

### Mobile (Expo)
1. Build for production: `expo build`
2. Submit to app stores: `expo submit`
3. Or use Expo Go for development

## 🔑 Environment Variables

The following environment variables are pre-configured:

```env
# Database (Prisma Cloud)
DATABASE_URL="postgres://..."
PRISMA_DATABASE_URL="prisma+postgres://..."

# AI Integration (OpenRouter)
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="qwen/qwen3-30b-a3b-instruct-2507"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 📊 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chats table
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Next Steps

1. **Web Interface**: Create a web version of the chat interface
2. **Authentication**: Implement proper user authentication (OAuth, JWT)
3. **Web Search**: Integrate real search API (SerpApi, Brave Search)
4. **File Uploads**: Support for image and document uploads
5. **Push Notifications**: Real-time notifications for mobile
6. **Voice Chat**: Voice input and output capabilities
7. **Multi-Agent**: Support for multiple AI agents and personas

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.