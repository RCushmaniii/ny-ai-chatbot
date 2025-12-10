<h1 align="center">🤖 NY AI Chatbot</h1>

<p align="center">
    <strong>Production-ready, enterprise-grade AI chatbot platform</strong> with advanced RAG intelligence, comprehensive admin analytics, and single-tenant architecture.
</p>

<p align="center">
  Built for <a href="https://www.nyenglishteacher.com">New York English Teacher</a> • Bilingual (EN/ES) • Fully Deployed • Ready for Clients
</p>

<p align="center">
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#-admin-panel--analytics"><strong>Admin Panel</strong></a> ·
  <a href="#-tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#-deployment"><strong>Deployment</strong></a> ·
  <a href="#-documentation"><strong>Docs</strong></a>
</p>

---

## ✨ What's New (Priority #1-4 Complete)

✅ **Admin Profile & Account Management** - Secure login, password changes, account settings  
✅ **Advanced Analytics Dashboard** - 7/30/90-day metrics, daily trends, top questions  
✅ **Chat Logs Viewer** - Full transcript search, filtering, CSV export  
✅ **Knowledge Insights Engine** - RAG performance tracking, content gap analysis, chunk heatmaps

<br/>

## Features

### Core Capabilities

- **🌐 Bilingual Support** - Automatically responds in English or Spanish based on user input
- **🧠 RAG (Retrieval Augmented Generation)** - Answers questions using business-specific knowledge base
- **📁 Multi-Source Knowledge Base** - Upload files, scrape websites, or add manual content
- **🎯 Deterministic RAG** - Server-side context injection for reliable, accurate responses
- **💬 Real-time Chat** - Streaming responses with AI SDK
- **📚 Persistent Chat History** - Save and retrieve conversation history
- **🔗 Source Attribution** - Automatically includes URLs in responses for transparency
- **⚡ Starter Questions** - Customizable suggested prompts to guide users

### Technical Features

- [Next.js 15](https://nextjs.org) with App Router and Turbopack
  - React Server Components (RSCs) and Server Actions
  - Edge and Node.js runtime support
- [AI SDK](https://ai-sdk.dev/docs/introduction)
  - Direct OpenAI integration (GPT-4o, text-embedding-3-small)
  - Streaming text generation
  - Tool calling support
- [shadcn/ui](https://ui.shadcn.com)
  - Modern UI components with [Tailwind CSS](https://tailwindcss.com)
  - Accessible primitives from [Radix UI](https://radix-ui.com)
- **Vector Database**
  - PostgreSQL with pgvector extension
  - Semantic search for knowledge retrieval
  - Automatic text chunking and embedding
- [Auth.js](https://authjs.dev)
  - Secure authentication with NextAuth
- **PDF Processing**
  - Dual-parser strategy (unpdf + pdf-parse)
  - Robust error handling and validation

## 📊 Admin Panel & Analytics

The `/admin` route provides a **9-tab professional dashboard** for complete chatbot management:

### 1. 📋 Manual Content

- Upload `.txt`, `.md`, and `.pdf` files
- Add content manually via textarea
- Categorize by type (Services, Pricing, FAQ, etc.)
- Support for English and Spanish content

### 2. 🌐 Website Scraping

- **Automatic sitemap scraping** - Index entire websites automatically
- **Knowledge base stats** - View counts for website vs manual content
- **One-click ingestion** - Run from the UI
- **Clear data** - Reset website content when needed
- Processes 48+ pages into 193+ searchable chunks

### 3. ⚙️ Bot Settings (Starter Questions)

- **Add/Edit/Delete** suggested questions
- **Emoji support** for visual appeal
- **Live preview** of how questions appear to users
- **Bilingual questions** - Mix English and Spanish prompts

### 4. 💬 Instructions (System Prompts)

- **Bot name** customization
- **Custom system instructions** - Define personality and behavior
- **Risk-averse templates** - Pre-built cautious response patterns
- **Reset to default** - Restore original instructions

### 5. 🔗 Embed Code

- **One-click embed code** - Copy/paste widget for your website
- **Responsive design** - Works on all devices
- **Customizable dimensions** - Adjust width/height

### 6. 📈 Analytics Dashboard ⭐ NEW

- **Usage Metrics** - Total chats, messages, unique sessions
- **Time-based Views** - Last 7/30/90 days
- **Daily Trends** - Line charts showing activity over time
- **Top Questions** - Most common user queries
- **Language Breakdown** - EN vs ES usage
- **Knowledge Base Hit Ratio** - RAG performance metrics

### 7. 📜 Chat Logs Viewer ⭐ NEW

- **Paginated Chat List** - Browse all conversations
- **Full-text Search** - Find chats by content
- **Date Filtering** - Filter by date range
- **Language Filter** - EN/ES conversations
- **Transcript Viewer** - Read complete conversations
- **CSV Export** - Download chat data for analysis

### 8. 💡 Knowledge Insights ⭐ NEW

- **RAG Hit Ratio** - % of queries using knowledge base
- **Top Sources** - Most valuable knowledge sources with usage stats
- **Missing Knowledge** - Unanswered questions (content gaps)
- **Chunk Heatmap** - Best/worst performing content chunks
- **Performance Trends** - 7/30/90-day RAG quality metrics
- **Example Queries** - See what users actually ask

### 9. 👤 Account Settings ⭐ NEW

- **Profile Information** - View admin details
- **Secure Password Change** - Update credentials
- **Account Type** - Administrator designation
- **Logout** - Secure session termination

## 🏗️ Enterprise Features

### Security & Authentication

- ✅ Secure admin authentication with NextAuth
- ✅ Password hashing with bcrypt
- ✅ Session management
- ✅ Role-based access control (admin-only)
- ✅ Single-tenant architecture (isolated data)

### Data & Analytics

- ✅ Real-time chat logging
- ✅ RAG event tracking (knowledge retrieval logging)
- ✅ Usage analytics and metrics
- ✅ Performance monitoring
- ✅ CSV export capabilities

### Knowledge Management

- ✅ Multi-source knowledge base (website + documents)
- ✅ Semantic search with pgvector
- ✅ Automatic content chunking
- ✅ Embedding generation and caching
- ✅ Content gap detection

### Deployment & Scalability

- ✅ Production-ready on Vercel
- ✅ Automatic SSL/HTTPS
- ✅ Database migrations
- ✅ Environment-based configuration
- ✅ Responsive design (mobile-friendly)

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **Language:** TypeScript
- **AI/ML:** OpenAI (GPT-4o, text-embedding-3-small)
- **Database:** PostgreSQL with pgvector
- **ORM:** Drizzle ORM
- **Authentication:** Auth.js (NextAuth)
- **UI:** React 19, Tailwind CSS, shadcn/ui
- **PDF Processing:** unpdf, pdf-parse
- **Deployment:** Vercel
- **Monitoring:** Vercel Analytics

## RAG Knowledge Base

This chatbot uses a **dual-table RAG implementation** with:

### Architecture

1. **Two Knowledge Tables:**
   - `website_content` - Automatically scraped from sitemap (193 chunks from 48 pages)
   - `Document_Knowledge` - Manually uploaded files and text
2. **Search Priority:**

   - Searches `website_content` first (0.5 similarity threshold)
   - Falls back to `Document_Knowledge` if no results (0.6 similarity threshold)

3. **Vector Database** - PostgreSQL with pgvector extension
   - Cosine similarity search
   - IVFFlat indexes for performance
4. **Embeddings** - OpenAI `text-embedding-3-small` (1536 dimensions)

5. **Deterministic RAG** - Server-side context injection

   - Knowledge retrieved before LLM call
   - Results injected into system prompt
   - URLs automatically included in responses

6. **Automatic Chunking:**
   - Website content: 1000 characters with 200 overlap
   - Manual content: 1500 characters with paragraph-aware splitting

### Ingestion Pipeline

The `scripts/ingest.ts` script:

- Fetches and parses XML sitemaps
- Filters URLs by pattern (e.g., only `/en/` pages)
- Scrapes HTML with Cheerio
- Extracts clean text content
- Splits into chunks
- Generates embeddings
- Stores in `website_content` table
- **Idempotent** - Truncates table before re-ingestion

### Knowledge Base Content Types

- **Services** - English coaching offerings
- **Target Audience** - Professional demographics
- **Pricing** - Session rates and packages
- **FAQs** - Common questions
- **Blog Posts** - Educational content
- **Testimonials** - Client reviews
- **Business Info** - Contact details, booking URL

## 🚀 Deployment

### Current Status

- ✅ **Production Ready** - Fully tested and deployed
- ✅ **Vercel Hosting** - Automatic deployments from GitHub
- ✅ **Database Migrations** - All schema updates applied
- ✅ **Admin User** - Created and configured

### Deploy Your Own

Deploy to Vercel in minutes:

1. **Fork/Clone** this repository
2. **Connect to Vercel** - Import from GitHub
3. **Add Environment Variables** - Database URL, OpenAI key, auth secret
4. **Deploy** - Automatic builds on every push
5. **Run Migrations** - Execute SQL migrations on production database
6. **Create Admin User** - Use `pnpm create-admin` script

See [PRODUCTION_DEPLOYMENT_GUIDE.md](./docs/PRODUCTION_DEPLOYMENT_GUIDE.md) for detailed instructions.

## Running Locally

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database with pgvector extension
- OpenAI API key

### Environment Variables

Create a `.env.development.local` file with:

```bash
# Database
POSTGRES_URL="postgresql://user:password@host:5432/database"

# OpenAI
OPENAI_API_KEY="sk-..."

# Auth (generate with: openssl rand -base64 32)
AUTH_SECRET="your-secret-key"
```

### Installation

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Setup database:**

   ```bash
   pnpm db:migrate
   ```

3. **Populate knowledge base (optional):**

   ```bash
   npx tsx scripts/populate-knowledge.ts
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

Your app should now be running on [localhost:3000](http://localhost:3000).

### Key Routes

- `/` - Main chat interface
- `/admin` - Knowledge base management (requires authentication)
- `/documentation` - Project documentation

## Project Structure

```
ny-ai-chatbot/
├── app/
│   ├── (auth)/              # Authentication routes
│   ├── (chat)/              # Chat interface and API
│   │   ├── api/chat/        # Chat API endpoint
│   │   └── admin/           # Admin panel
│   └── api/
│       └── admin/knowledge/ # Knowledge base API
├── components/              # React components
│   ├── admin-knowledge-base.tsx
│   ├── chat.tsx
│   └── ...
├── lib/
│   ├── ai/                  # AI configuration
│   │   ├── prompts.ts       # System prompts
│   │   ├── providers.ts     # OpenAI setup
│   │   └── tools/           # RAG search tool
│   └── db/                  # Database
│       ├── schema.ts        # Drizzle schema
│       └── migrate.ts       # Migration script
├── docs/                    # Documentation
└── scripts/
    └── populate-knowledge.ts # Seed script
```

## White-Label Deployment

This chatbot is designed for easy white-label deployment. Follow these steps to customize for your business:

### 1. Database Setup

Run the migration SQL in your Vercel Postgres SQL Editor:

```sql
-- See migrations/create_bot_settings.sql
CREATE TABLE IF NOT EXISTS bot_settings (
  id SERIAL PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "botName" VARCHAR(100),
  "customInstructions" TEXT,
  "starterQuestions" JSONB,
  colors JSONB,
  settings JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 2. Customize via Admin Dashboard

Navigate to `/admin` and configure:

1. **Instructions Tab:**

   - Set your bot name
   - Write custom system instructions
   - Define personality and tone
   - Set knowledge scope and boundaries

2. **Bot Settings Tab:**

   - Add starter questions in your language(s)
   - Include emojis for visual appeal
   - Preview how they'll appear

3. **Website Scraping Tab:**

   - Enter your sitemap URL
   - Click "Run Ingestion"
   - Monitor progress and stats

4. **Manual Content Tab:**
   - Upload PDFs, TXT, MD files
   - Add content via textarea
   - Categorize by type

### 3. Update Environment Variables

```bash
# Required
OPENAI_API_KEY="sk-..."
POSTGRES_URL="postgresql://..."
AUTH_SECRET="..." # Generate with: openssl rand -base64 32

# Optional
NEXT_PUBLIC_APP_NAME="Your Business Name"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### 4. Customize Branding

Edit `lib/ai/prompts.ts` to update:

- Business name and description
- Services offered
- Target audience
- Pricing information
- Contact/booking URLs

### 5. Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Deploy via Vercel CLI or dashboard
vercel --prod
```

### 6. Post-Deployment

1. Create an admin user account
2. Log in to `/admin`
3. Configure all settings
4. Run website ingestion
5. Test the chatbot thoroughly
6. Monitor usage and refine prompts

## ✅ Status & Roadmap

**Current Version:** v2.0.0  
**Status:** ✅ Live in Production  
**Production URL:** https://ny-ai-chatbot.vercel.app

### Current Phase: Testing & Validation

We're currently in **Phase 1** - thoroughly testing all features on the Vercel domain before website integration.

**👉 [View Complete Roadmap](./ROADMAP.md)**

### Completed Features (v2.0)

- ✅ Bilingual chatbot (EN/ES)
- ✅ RAG with semantic search
- ✅ Multi-source knowledge base
- ✅ Admin authentication & security
- ✅ 9-tab admin dashboard
- ✅ Advanced analytics
- ✅ Chat logs viewer with export
- ✅ Knowledge insights engine
- ✅ Account management
- ✅ Production deployment on Vercel
- ✅ CVE vulnerability patches

### Next Steps

1. **Test Admin Panel** - Verify all 9 tabs work correctly
2. **Test Chatbot** - Validate RAG retrieval and responses
3. **Add Content** - Populate knowledge base
4. **Website Integration** - Embed on nyenglishteacher.com
5. **Custom Domain** - Set up chat.nyenglishteacher.com

### Future Enhancements (Phase 4)

- 🔮 Multi-model AI support (Claude, Gemini)
- 🔮 Voice input/output
- 🔮 Mobile app
- 🔮 WhatsApp/Messenger integration
- 🔮 Advanced analytics & reporting
- 🔮 Multi-tenant support
- 🔮 API for third-party integrations

---

## 📚 Documentation

Complete documentation is available in the `/docs` folder:

### Quick Links

- **[📋 Product Roadmap](./ROADMAP.md)** - Development phases and timeline
- **[📖 Documentation Index](./docs/INDEX.md)** - Central navigation hub
- **[🚀 Getting Started](./docs/01-getting-started.md)** - Setup and installation
- **[👨‍💼 Admin Guide](./docs/ADMIN_GUIDE.md)** - Complete admin panel guide
- **[☁️ Production Deployment](./docs/PRODUCTION_DEPLOYMENT_GUIDE.md)** - Deploy to production
- **[🌐 Website Integration](./docs/EMBED_WIDGET.md)** - Embed chatbot on your site
- **[🧠 RAG Architecture](./docs/02-rag-architecture.md)** - How the RAG system works
- **[📚 Knowledge Base](./docs/03-knowledge-base.md)** - Managing content
- **[✅ Testing Checklist](./docs/TESTING_CHECKLIST.md)** - Pre-launch testing
- **[📝 Release Notes](./RELEASE_NOTES.md)** - Version history and changes

👉 **[View Full Documentation Index](./docs/INDEX.md)**

## License

MIT
