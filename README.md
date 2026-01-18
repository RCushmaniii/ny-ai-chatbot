# NY AI Chatbot

**Drop-in AI chatbot widget with RAG intelligence for small business websites.**

An embeddable customer support chatbot that answers questions using your website content and documents. Built for [New York English Teacher](https://www.nyenglishteacher.com), designed to be white-labeled for any business.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://ny-ai-chatbot.vercel.app)
[![Status](https://img.shields.io/badge/status-production-blue)]()
[![License](https://img.shields.io/badge/license-MIT-gray)]()

---

## Why This Exists

Most small businesses need a chatbot that:
- Answers questions accurately using *their* content (not hallucinations)
- Works in multiple languages
- Requires zero coding to manage
- Costs less than enterprise solutions

This project solves that with a single-tenant architecture, admin dashboard, and RAG-powered responses.

---

## Key Features

| Feature | What It Does |
|---------|--------------|
| **RAG Intelligence** | Answers using your website content + uploaded docs, not generic AI responses |
| **Bilingual (EN/ES)** | Auto-detects language and responds accordingly |
| **Embeddable Widget** | One script tag to add to any website |
| **Admin Dashboard** | 9-tab panel: analytics, chat logs, knowledge base, settings |
| **Source Attribution** | Responses include links to source pages |
| **Zero Hallucination Design** | Server-side context injection ensures factual responses |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| AI | OpenAI GPT-4o + text-embedding-3-small |
| Database | PostgreSQL + pgvector |
| ORM | Drizzle |
| Auth | Auth.js (NextAuth) |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Deployment | Vercel |

---

## Quick Start

### Prerequisites

- Node.js 18+, pnpm
- PostgreSQL with pgvector extension
- OpenAI API key

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/ny-ai-chatbot.git
cd ny-ai-chatbot
pnpm install
```

### 2. Configure Environment

Create `.env.local`:

```bash
POSTGRES_URL="postgresql://user:pass@host:5432/db"
OPENAI_API_KEY="sk-..."
AUTH_SECRET="$(openssl rand -base64 32)"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-password"
```

### 3. Setup Database

```bash
pnpm db:migrate
pnpm create-admin
```

### 4. Run

```bash
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Admin panel at `/admin`.

---

## Usage

### Embed on Your Website

Copy from Admin Panel → Embed Code tab, or use:

```html
<script
  src="https://your-domain.vercel.app/api/embed"
  data-position="bottom-right"
  defer>
</script>
```

### Populate Knowledge Base

**Option A: Scrape your website**
1. Go to Admin → Website Scraping
2. Enter sitemap URL
3. Click "Run Ingestion"

**Option B: Upload documents**
1. Go to Admin → Manual Content
2. Upload PDF, TXT, or MD files

**Option C: CLI**
```bash
pnpm ingest  # Scrapes configured sitemap
```

---

## Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |

### Optional Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Production URL for embed script |
| `REDIS_URL` | Enables resumable streams |
| `UPSTASH_REDIS_REST_URL` | Production rate limiting |
| `SENTRY_DSN` | Error monitoring |

---

## Architecture

```
User Message
    ↓
Generate Embedding (text-embedding-3-small)
    ↓
Vector Search (pgvector, cosine similarity)
    ├── website_content table (scraped pages)
    └── Document_Knowledge table (uploads)
    ↓
Inject Context into System Prompt
    ↓
Stream Response (GPT-4o)
    ↓
Include Source URLs
```

**Key Design Decisions:**
- Server-side RAG (context injected before LLM call, not via tool)
- Dual-table knowledge base (website vs. manual content)
- Similarity thresholds: 0.5 (website), 0.6 (documents)
- Chunk size: 1000 chars with 200 overlap

See [RAG Architecture Docs](./docs/02-rag-architecture.md) for details.

---

## Admin Dashboard

Access at `/admin` (requires login).

| Tab | Purpose |
|-----|---------|
| Manual Content | Upload files, add text content |
| Website Scraping | Auto-ingest from sitemap |
| Bot Settings | Starter questions, customization |
| Instructions | System prompt, bot personality |
| Embed Code | Copy widget script |
| Analytics | Usage metrics, trends, top questions |
| Chat Logs | Search transcripts, export CSV |
| Knowledge Insights | RAG performance, content gaps |
| Account | Password change, profile |

---

## Project Structure

```
ny-ai-chatbot/
├── app/
│   ├── (auth)/           # Auth routes
│   ├── (chat)/           # Chat UI + API
│   │   └── admin/        # Admin dashboard
│   ├── api/              # API routes
│   └── embed/            # Widget iframe
├── components/           # React components
├── lib/
│   ├── ai/               # Prompts, tools, providers
│   ├── db/               # Schema, queries, migrations
│   └── security/         # CORS, validation
├── scripts/              # CLI utilities
└── docs/                 # Documentation
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

Builds run migrations automatically.

### Manual

```bash
pnpm build
pnpm start
```

See [Production Deployment Guide](./docs/PRODUCTION_DEPLOYMENT_GUIDE.md).

---

## Security

- Admin authentication via Auth.js
- Password hashing with bcrypt
- Session-based rate limiting
- CORS allowlist for embed domains
- Input validation and sanitization

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please run `pnpm lint` and `pnpm test` before submitting.

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](./docs/01-getting-started.md) | Installation and setup |
| [Admin Guide](./docs/ADMIN_GUIDE.md) | Dashboard usage |
| [RAG Architecture](./docs/02-rag-architecture.md) | How search works |
| [Embed Widget](./docs/EMBED_WIDGET.md) | Website integration |
| [Production Deployment](./docs/PRODUCTION_DEPLOYMENT_GUIDE.md) | Vercel setup |
| [Full Index](./docs/INDEX.md) | All documentation |

---

## License

MIT

---

**Built for [New York English Teacher](https://www.nyenglishteacher.com)** | [Live Demo](https://ny-ai-chatbot.vercel.app)
