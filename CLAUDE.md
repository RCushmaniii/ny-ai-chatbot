# CLAUDE.md - NY AI Chatbot

This file provides context for AI assistants working with this codebase.

## Project Overview

**NY AI Chatbot** is an enterprise-grade AI chatbot platform with RAG (Retrieval Augmented Generation) capabilities. Built for [New York English Teacher](https://www.nyenglishteacher.com), it provides bilingual (English/Spanish) customer support through an embeddable widget.

## Tech Stack

- **Framework:** Next.js 15 (App Router, React Server Components)
- **Language:** TypeScript
- **AI:** OpenAI GPT-4o (chat), text-embedding-3-small (embeddings)
- **Database:** PostgreSQL with pgvector extension
- **ORM:** Drizzle ORM
- **Auth:** NextAuth 5 (Auth.js)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui, Radix UI
- **Deployment:** Vercel

## Directory Structure

```
ny-ai-chatbot/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, guest)
│   ├── (chat)/            # Main chat routes
│   │   ├── admin/         # Admin dashboard
│   │   └── api/           # Chat API endpoints
│   ├── api/               # API routes
│   │   ├── admin/         # Admin APIs (analytics, knowledge, settings)
│   │   ├── cron/          # Scheduled jobs
│   │   └── embed/         # Widget embed APIs
│   └── embed/             # Embeddable chat page
├── components/            # React components
│   ├── admin-*.tsx        # Admin panel components
│   ├── ui/               # shadcn/ui components
│   └── elements/         # Chat message elements
├── lib/                  # Shared libraries
│   ├── ai/               # AI config, prompts, tools
│   ├── db/               # Database schema, queries, migrations
│   ├── security/         # CORS, validation
│   └── utils/            # Utility functions
├── docs/                 # Documentation (30+ files)
├── scripts/              # CLI utilities
└── tests/                # Playwright E2E tests
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `lib/db/schema.ts` | Database schema with all tables |
| `lib/ai/prompts.ts` | System prompts and bot personality |
| `lib/ai/tools/search-knowledge.ts` | RAG search implementation |
| `lib/security/cors.ts` | CORS allowed origins |
| `lib/security/validation.ts` | Input validation and rate limiting |
| `app/(chat)/api/chat/route.ts` | Main chat API endpoint |
| `app/api/embed/route.ts` | Embed widget script generator |
| `middleware.ts` | Auth middleware and route protection |

## Database Schema

### Core Tables
- `User` - User accounts (admin and guest)
- `Chat` - Chat sessions with userId or sessionId
- `Message_v2` - Chat messages with parts array
- `Vote_v2` - Message votes/feedback

### Knowledge Tables
- `Document_Knowledge` - Manual content uploads
- `website_content` - Scraped website content (created via migration)

### Analytics Tables
- `chat_analytics` - Session metrics
- `knowledge_events` - RAG search logging

### Settings
- `bot_settings` - Singleton bot configuration

## Common Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm build            # Build for production (runs migrations)
pnpm start            # Start production server

# Database
pnpm db:migrate       # Run Drizzle migrations
pnpm db:studio        # Open Drizzle Studio
pnpm db:generate      # Generate migration files

# Scripts
pnpm create-admin     # Create admin user
pnpm ingest           # Ingest website content
pnpm reset-messages   # Reset message counts

# Testing
pnpm test             # Run Playwright E2E tests
pnpm lint             # Run Biome linter
pnpm format           # Format with Biome
```

## Environment Variables

Required:
- `POSTGRES_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `AUTH_SECRET` - NextAuth secret (generate: `openssl rand -base64 32`)
- `ADMIN_EMAIL` - Admin user email
- `ADMIN_PASSWORD` - Admin user password

Optional:
- `NEXT_PUBLIC_APP_URL` - Public app URL for embeds
- `REDIS_URL` - For resumable streams (disabled currently)

## Architecture Notes

### RAG System
1. User message → Generate embedding
2. Search `website_content` (0.5 threshold)
3. Search `Document_Knowledge` (0.6 threshold)
4. Merge top 5 results by similarity
5. Inject into system prompt with source URLs

### Authentication
- Admin users: Credentials provider with email/password
- Anonymous users: Guest provider, auto-created
- Session tracking via `sessionId` for non-auth users

### Embed Widget
- Script at `/api/embed` generates self-contained JS
- Widget loads iframe from `/embed/chat`
- CORS configured for allowed domains

## API Patterns

### Chat API (`POST /api/chat`)
- Validates session (admin or guest)
- Rate limits by session and IP
- Searches knowledge base
- Streams response with AI SDK
- Logs usage and messages

### Admin APIs (`/api/admin/*`)
- Require authenticated admin session
- Return JSON responses
- Handle CORS for same-origin

## Current Status

- **Version:** 1.1.0
- **Status:** Production-ready
- **Deployment:** Vercel
- **Production URL:** https://ny-ai-chatbot.vercel.app

## Known Issues / TODOs

1. Rate limiting uses in-memory storage (needs Redis for production)
2. CORS origins hardcoded in `lib/security/cors.ts`
3. Deprecated v1 message schema still in codebase
4. Console.log statements need structured logging

## Integration with ny-eng

To embed on nyenglishteacher.com:
1. Add domain to CORS allowed list
2. Use embed script from admin panel
3. Configure widget via data attributes

See `docs/EMBED_WIDGET.md` for full integration guide.

## Development Guidelines

- Use TypeScript strict mode
- Follow Biome linting rules
- Test with Playwright for E2E
- Use Drizzle for all database operations
- Stream responses with AI SDK
- Keep prompts in `lib/ai/prompts.ts`
