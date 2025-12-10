# 🚀 NY AI Chatbot - Vercel Deployment Guide

## What You're Deploying

Your complete bilingual RAG chatbot application:

- ✅ Next.js web application (admin dashboard + chat interface)
- ✅ Embed widget (JavaScript snippet for nyenglishteacher.com)
- ✅ API routes (chat, RAG retrieval, embed script)
- ✅ Bilingual knowledge base (606 chunks: 308 Spanish + 298 English)

---

## Prerequisites

Before deploying, you need:

1. **GitHub account** (✅ You have this - code is already pushed)
2. **Vercel account** (free tier works great)
3. **OpenAI API key** (✅ You have this)
4. **Production PostgreSQL database** (choose one below)

---

## Step 1: Set Up Production Database

### Option A: Vercel Postgres (Recommended - Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **Storage** → **Create Database** → **Postgres**
4. Name it: `ny-chatbot-db`
5. Select region: **US East** (closest to your users)
6. Click **Create**
7. Vercel will automatically add `POSTGRES_URL` to your project

**Free Tier Limits:**

- 256 MB storage (enough for ~10,000 knowledge chunks)
- 60 hours compute/month

### Option B: Neon (Good Alternative)

1. Go to [neon.tech](https://neon.tech)
2. Sign up (free)
3. Create new project: `ny-chatbot`
4. Copy the connection string (starts with `postgresql://`)
5. You'll add this as `POSTGRES_URL` in Vercel

**Free Tier Limits:**

- 512 MB storage
- 1 project, 10 branches

### Option C: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create new project: `ny-chatbot`
3. Go to **Settings** → **Database**
4. Copy **Connection String** (Transaction mode)
5. You'll add this as `POSTGRES_URL` in Vercel

**Free Tier Limits:**

- 500 MB storage
- 2 GB bandwidth

---

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select: `RCushmaniii/ny-ai-chatbot`
4. Click **Import**

### 2.2 Configure Project Settings

**Framework Preset:** Next.js (auto-detected)
**Root Directory:** `./` (leave default)
**Build Command:** `npm run build` (auto-detected)
**Output Directory:** `.next` (auto-detected)

### 2.3 Add Environment Variables

Click **Environment Variables** and add these:

```bash
# Required - OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# Required - Database (from Step 1)
POSTGRES_URL=postgresql://user:pass@host/db

# Required - Authentication
AUTH_SECRET=your-random-secret-here
ADMIN_EMAIL=your-email@example.com

# Required - App URL (Vercel will provide this after first deploy)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional - AI Model
OPENAI_MODEL=gpt-4o-mini

# Optional - App Name
NEXT_PUBLIC_APP_NAME=NY English Teacher AI
```

**How to generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

Or use: https://generate-secret.vercel.app/32

### 2.4 Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://ny-ai-chatbot.vercel.app`

---

## Step 3: Initialize Database Schema

After first deployment:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Copy your `POSTGRES_URL`
4. Run locally:

```bash
# Set the production database URL temporarily
$env:POSTGRES_URL="your-production-postgres-url"

# Push schema to production database
npm run db:push

# Verify schema
npm run db:studio
```

---

## Step 4: Ingest Knowledge Base

Load your bilingual knowledge base into production:

1. Go to your deployed app: `https://your-app.vercel.app`
2. Click **Login** → Register with your `ADMIN_EMAIL`
3. Go to **Admin** → **Knowledge Base**
4. Enter sitemap URL: `https://nyenglishteacher.com/sitemap.xml`
5. Click **Ingest Website**
6. Wait ~2-3 minutes for ingestion to complete

**Expected Results:**

- ~606 chunks total
- ~308 Spanish chunks from `/es/` pages
- ~298 English chunks from `/en/` pages

---

## Step 5: Update App URL

After deployment, update the app URL:

1. Copy your Vercel deployment URL
2. Go to **Settings** → **Environment Variables**
3. Update `NEXT_PUBLIC_APP_URL` to your actual URL
4. Click **Save**
5. Redeploy (Vercel will auto-redeploy)

---

## Step 6: Set Up Custom Domain (Optional)

### 6.1 Add Domain to Vercel

1. Go to **Settings** → **Domains**
2. Add domain: `chat.nyenglishteacher.com`
3. Vercel will provide DNS records

### 6.2 Update DNS (Namecheap/GoDaddy/etc)

Add these DNS records:

**CNAME Record:**

- Name: `chat`
- Value: `cname.vercel-dns.com`
- TTL: Automatic

### 6.3 Update Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` to: `https://chat.nyenglishteacher.com`
3. Redeploy

---

## Step 7: Embed Widget on Your Website

### 7.1 Add to FAQ Pages

Add this script to your FAQ pages:

**English FAQ** (`/en/faqs/`):

```html
<script
  src="https://chat.nyenglishteacher.com/api/embed"
  data-welcome-message="👋 Hi! Ask me anything about NY English Teacher!"
  data-language="en"
  data-button-color="#4f46e5"
  data-position="bottom-right"
  async
></script>
```

**Spanish FAQ** (`/es/preguntas-frecuentes/`):

```html
<script
  src="https://chat.nyenglishteacher.com/api/embed"
  data-welcome-message="👋 ¡Hola! ¡Pregúntame sobre NY English Teacher!"
  data-language="es"
  data-button-color="#4f46e5"
  data-position="bottom-right"
  async
></script>
```

### 7.2 Test Widget

1. Visit your FAQ page
2. You should see the chat bubble in bottom-right
3. Click to open and test questions
4. Verify language-specific responses

---

## Step 8: Configure CORS (Security)

Update CORS settings to only allow your domain:

1. Edit `lib/security/cors.ts`
2. Update `allowedOrigins`:

```typescript
const allowedOrigins = [
  "https://nyenglishteacher.com",
  "https://www.nyenglishteacher.com",
  "https://chat.nyenglishteacher.com",
];
```

3. Commit and push:

```bash
git add lib/security/cors.ts
git commit -m "chore: Update CORS for production domain"
git push origin main
```

Vercel will auto-deploy the update.

---

## 🎯 Post-Deployment Checklist

- [ ] Database schema created (`npm run db:push`)
- [ ] Knowledge base ingested (606 chunks)
- [ ] Admin account created
- [ ] Custom domain configured (optional)
- [ ] Widget embedded on FAQ pages
- [ ] CORS configured for production domain
- [ ] Environment variables set correctly
- [ ] Test chatbot in English and Spanish
- [ ] Monitor usage in Vercel dashboard

---

## 📊 Monitoring & Maintenance

### Vercel Dashboard

Monitor:

- **Analytics**: Page views, response times
- **Logs**: API errors, function invocations
- **Usage**: Bandwidth, function executions

### Database Monitoring

- **Vercel Postgres**: Built-in dashboard
- **Neon**: Project dashboard
- **Supabase**: Database metrics

### Update Knowledge Base

When your website content changes:

1. Go to Admin → Knowledge Base
2. Click **Ingest Website** again
3. Old chunks are replaced with new ones

---

## 🆘 Troubleshooting

### Widget Not Showing

1. Check browser console for errors
2. Verify `NEXT_PUBLIC_APP_URL` is correct
3. Check CORS settings allow your domain
4. Hard refresh: `Ctrl + Shift + R`

### Database Connection Error

1. Verify `POSTGRES_URL` is correct
2. Check database is running
3. Ensure IP allowlist includes Vercel IPs (if using external DB)

### Chat Not Responding

1. Check OpenAI API key is valid
2. Verify knowledge base has chunks
3. Check Vercel function logs for errors

### Rate Limiting Issues

Adjust in `lib/security/validation.ts`:

```typescript
const RATE_LIMITS = {
  perMinute: 20, // Increase if needed
  perHour: 100, // Increase if needed
};
```

---

## 💰 Cost Estimates (Free Tier)

**Vercel:**

- Free tier: 100 GB bandwidth, 100 GB-hours compute
- Estimated cost: **$0/month** (within free tier)

**Database:**

- Vercel Postgres: **$0/month** (free tier)
- Neon: **$0/month** (free tier)
- Supabase: **$0/month** (free tier)

**OpenAI:**

- GPT-4o-mini: ~$0.15 per 1M input tokens
- Estimated: **$5-10/month** (depends on usage)
- 100 conversations/day ≈ $3-5/month

**Total Estimated Monthly Cost: $5-10** (just OpenAI API)

---

## 🎉 You're Live!

Your bilingual AI chatbot is now:

- ✅ Deployed to production
- ✅ Accessible at your custom domain
- ✅ Embedded on your website
- ✅ Answering questions in English and Spanish
- ✅ Backed by your full knowledge base

**Demo Pages:**

- English: `https://chat.nyenglishteacher.com/demo`
- Spanish: `https://chat.nyenglishteacher.com/es/demo`

**Admin Dashboard:**

- `https://chat.nyenglishteacher.com/admin`

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [OpenAI API](https://platform.openai.com/docs)

---

**Need help?** Check `PRODUCTION_CHECKLIST.md` for detailed production readiness steps.
