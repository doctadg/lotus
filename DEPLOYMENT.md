# 🚀 Deployment Guide

## 📋 Prerequisites Checklist
- [x] Git repository initialized and committed
- [x] Monorepo structure with backend and mobile
- [x] Environment variables configured
- [x] Database schema deployed to Prisma Cloud
- [ ] GitHub repository created
- [ ] Vercel deployment setup

## 🐙 GitHub Repository Setup

### Step 1: Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `ai-chat-app` or your preferred name
3. Set it to **Public** or **Private** based on your preference
4. **DO NOT** initialize with README, .gitignore, or license (we already have these)

### Step 2: Connect Local Repository to GitHub
Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub details:

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🔥 Vercel Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect GitHub Repository**:
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

3. **Environment Variables**:
   Add these in Vercel dashboard under Environment Variables:
   ```
   DATABASE_URL=postgres://acd52080ea89565ead001284e67587189147cbdf398b545ed4a0e24ae87c97b5:sk_dY5W2vK8w9KDLHf6qt7J0@db.prisma.io:5432/?sslmode=require
   
   PRISMA_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19kWTVXMnZLOHc5S0RMSGY2cXQ3SjAiLCJhcGlfa2V5IjoiMDFLMU5EQVFYMlYwQVRGNEpTVEE3UEFHUjYiLCJ0ZW5hbnRfaWQiOiJhY2Q1MjA4MGVhODk1NjVlYWQwMDEyODRlNjc1ODcxODkxNDdjYmRmMzk4YjU0NWVkNGEwZTI0YWU4N2M5N2I1IiwiaW50ZXJuYWxfc2VjcmV0IjoiMTBmODA3NzAtNDRlZS00YzYyLWJlOGEtMjI2NDhiMjgyNThkIn0.E6jK-CCXnCHjHgmGngTcwMehcr3mMOvv9nenwcfK02s
   
   OPENROUTER_API_KEY=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
   
   OPENROUTER_MODEL=qwen/qwen3-30b-a3b-instruct-2507
   
   NEXTAUTH_SECRET=d21ad7f9d7dc10d10716c0f46b1f90c734d04ecb007782733aef9679b77e18e6
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your backend will be available at `https://your-app-name.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from backend directory
cd backend
vercel --prod

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? [your-username]
# - Link to existing project? N
# - Project name? ai-chat-backend
# - In which directory is your code? ./
# - Want to override settings? N
```

## 📱 Update Mobile App Configuration

After deployment, update the mobile app to point to your production backend:

### File: `mobile/src/services/api.ts`
```typescript
// Replace this line:
private baseURL = 'http://localhost:3000/api'

// With your Vercel deployment URL:
private baseURL = 'https://your-app-name.vercel.app/api'
```

## 🧪 Testing Production Deployment

### Backend API Testing
Test your deployed backend:

```bash
# Health check
curl https://your-app-name.vercel.app/api/health

# Create user (should return user data)
curl -X POST https://your-app-name.vercel.app/api/user/profile \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

### Mobile App Testing
1. Update the API URL in mobile app
2. Run the mobile app: `cd mobile && npm start`
3. Test creating a new chat
4. Test sending messages and streaming responses

## 🔧 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Node.js version (should be 18+)
   - Verify all dependencies are in package.json
   - Check for TypeScript errors

2. **Database Connection Issues**:
   - Verify DATABASE_URL is correct
   - Check Prisma Cloud console for connection status
   - Ensure environment variables are set correctly

3. **API Timeout Issues**:
   - Adjust Vercel function timeout in vercel.json
   - Check OpenRouter API key validity
   - Monitor function execution times

4. **CORS Issues**:
   - Verify mobile app is using HTTPS URLs
   - Check that the API endpoints return proper headers

## 📊 Monitoring

### Vercel Dashboard
- Monitor function invocations
- Check error logs
- Monitor response times

### Database Monitoring
- Use Prisma Cloud dashboard
- Monitor connection usage
- Check query performance

## 🎯 Next Steps After Deployment

1. **Custom Domain** (Optional):
   - Configure custom domain in Vercel
   - Update mobile app API URL

2. **Environment-Specific Configs**:
   - Set up staging environment
   - Configure different OpenRouter models for different environments

3. **Performance Optimization**:
   - Enable Vercel Edge Functions for faster response times
   - Implement Redis caching for frequently accessed data

4. **Monitoring & Analytics**:
   - Set up error tracking (Sentry)
   - Monitor API usage and costs
   - Set up alerts for downtime

## 🔐 Security Checklist

- [x] Environment variables secured
- [x] Database connection encrypted
- [x] API keys not exposed in frontend
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] CORS properly configured for production

---

## 📞 Quick Commands Reference

```bash
# Local development
npm run dev                    # Start both backend and mobile
npm run dev:backend           # Backend only
npm run dev:mobile            # Mobile only

# Build
npm run build                 # Build backend for production
npm run build:mobile          # Build mobile for production

# Git operations
git add .                     # Stage changes
git commit -m "message"       # Commit changes
git push origin main          # Push to GitHub

# Vercel operations
vercel                        # Deploy to preview
vercel --prod                 # Deploy to production
vercel logs                   # View function logs
```