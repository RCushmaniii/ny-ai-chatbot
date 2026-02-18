---
# === CONTROL FLAGS ===
portfolio_enabled: true
portfolio_priority: 2
portfolio_featured: true

# === CARD DISPLAY ===
title: "NY AI Chatbot"
tagline: "Revenue-first RAG chatbot that converts visitors into booked strategy sessions"
slug: "ny-ai-chatbot"
category: "AI / Chatbots"
tech_stack:
  - "Next.js 15"
  - "TypeScript"
  - "OpenAI GPT-4o"
  - "pgvector"
  - "Drizzle ORM"
  - "Clerk"
  - "React 19"
  - "Tailwind CSS 4"
  - "shadcn/ui"
  - "Vercel AI SDK"
thumbnail: "/images/portfolio/ny-eng-chatbot-01.png"
status: "Production"

# === DETAIL PAGE ===
problem: "Language schools treat chatbots as deflection tools — reduce ticket volume, speed up FAQ answers, dead-end the conversation. The result is a cost center that never generates revenue. Meanwhile, anonymous website visitors leave without converting because there's no sales-aware system guiding them toward high-value actions like booking a strategy session."
solution: "An AI chatbot explicitly engineered as an automated sales agent. Every architectural layer — system prompts, RAG citations, error handling, rate limits — is designed to drive conversational conversion. The bot uses benefit-driven language with real client social proof, links RAG source citations to high-value service pages, and hard-codes CTAs for free strategy sessions directly into the system prompt."
key_features:
  - "Revenue-first RAG architecture merging website content and manual knowledge sources (top 5 by cosine similarity)"
  - "System prompts hard-coded with sales CTAs — every conversation steers toward booking a strategy session"
  - "Dual-source knowledge base: scraped website content (0.5 threshold) + curated documents (0.6 threshold)"
  - "Source citations that drive traffic to high-value service pages, increasing time-on-site and eliminating hallucination"
  - "Full EN/ES bilingual support with locale-aware personality and benefit-driven language"
  - "Embeddable widget (iframe + script tag) deployable on any client domain with CORS configuration"
  - "Admin dashboard with chat analytics, knowledge management, and bot settings"
metrics:
  - "5-layer revenue engine: System Prompts, Error CTAs, Localization, Rate Limits as Strategy, Source Citations"
  - "2 RAG knowledge sources merged by cosine similarity with configurable thresholds"
  - "Sub-second streaming responses via Vercel AI SDK with OpenAI GPT-4o"
  - "Zero-auth guest experience via sessionId cookies — no signup friction before conversion"

# === LINKS ===
demo_url: "https://ny-ai-chatbot.vercel.app"
live_url: "https://ny-ai-chatbot.vercel.app"

# === OPTIONAL ===
hero_images:
  - src: "/images/portfolio/ny-eng-chatbot-01.png"
    alt_en: "Conversational Conversion — The Architecture of a Revenue-First Chatbot"
    alt_es: "Conversion Conversacional — La Arquitectura de un Chatbot Orientado a Ingresos"
  - src: "/images/portfolio/ny-eng-chatbot-02.png"
    alt_en: "Moving Beyond the Support Cost Center — from Deflector to Converter"
    alt_es: "Mas Alla del Centro de Costos de Soporte — de Deflector a Convertidor"
  - src: "/images/portfolio/ny-eng-chatbot-03.png"
    alt_en: "The Five Gears of the Revenue Engine — Brain, Trigger, Chameleon, Soft Wall, Bridge"
    alt_es: "Los Cinco Engranajes del Motor de Ingresos — Cerebro, Disparador, Camaleon, Muro Suave, Puente"
  - src: "/images/portfolio/ny-eng-chatbot-04.png"
    alt_en: "System Prompts Are Hard-Coded to Sell — CTAs baked into the bot's DNA"
    alt_es: "Los Prompts del Sistema Estan Programados para Vender — CTAs integrados en el ADN del bot"
  - src: "/images/portfolio/ny-eng-chatbot-05.png"
    alt_en: "Benefit-Driven Language Builds Authority — Pivot to Value technique with client social proof"
    alt_es: "El Lenguaje Orientado a Beneficios Construye Autoridad — tecnica Pivot to Value con prueba social de clientes"
  - src: "/images/portfolio/ny-eng-chatbot-06.png"
    alt_en: "Source Citations Drive Traffic to High-Value Pages — RAG grounding that doubles as SEO"
    alt_es: "Las Citas de Fuentes Dirigen Trafico a Paginas de Alto Valor — grounding RAG que funciona como SEO"
  - src: "/images/portfolio/ny-eng-chatbot-07.png"
    alt_en: "Not a Support Tool — An Automated Sales Agent that books strategy sessions"
    alt_es: "No es una Herramienta de Soporte — Un Agente de Ventas Automatizado que agenda sesiones de estrategia"
video_url: "/video/ny-eng-chatbot-brief.mp4"
video_poster: "/video/ny-eng-chatbot-brief-poster.jpg"
tags:
  - "nextjs"
  - "typescript"
  - "openai"
  - "rag"
  - "pgvector"
  - "drizzle"
  - "clerk"
  - "tailwind"
  - "bilingual"
  - "chatbot"
  - "ai"
  - "vercel"
date_completed: "2025-12"
---

## Architecture Overview

NY AI Chatbot is an enterprise-grade conversational AI platform built as a revenue engine, not a support tool. The core design principle is "Conversational Conversion" — every layer of the system is architected to guide anonymous visitors toward booking a paid strategy session. RAG isn't just for accuracy; source citations deliberately link to high-value service pages. Rate limits aren't just for protection; they create urgency. Error messages aren't just for UX; they embed CTAs.

The system runs on a dual-source RAG pipeline: scraped website content (cosine similarity threshold 0.5) and manually curated knowledge documents (threshold 0.6) are searched independently, then the top 5 results are merged by similarity score and injected into the system prompt with source URLs.

## Key Engineering Decisions

**Revenue-first prompt architecture over neutral FAQ:** The system prompt in `lib/ai/prompts.ts` explicitly instructs the bot to offer free 30-minute strategy sessions and link to the booking page. This isn't a feature toggle — it's structural. The bot's personality, language, and CTAs are hard-coded to sell, using benefit-driven framing ("advance your career") rather than feature descriptions ("we teach grammar").

**Dual RAG sources over single knowledge base:** Website content is ingested via automated scraping with `text-embedding-3-small` embeddings stored in pgvector. Manual document uploads allow the admin to inject curated sales content that doesn't exist on the public website. Both sources are searched in parallel and merged, giving the bot access to both public-facing content and internal sales messaging.

**SessionId cookies over mandatory auth:** Anonymous visitors get a frictionless chat experience via `sessionId` cookies from `lib/session.ts` — no signup wall between the visitor and the conversion funnel. Clerk authentication is reserved exclusively for the admin dashboard.

**Embeddable widget over standalone app:** The chatbot deploys as a script tag + iframe combination served from `/api/embed`, allowing the client to drop it onto any page of their existing website. CORS is configured per-domain in `lib/security/cors.ts`.

## The Five Gears

1. **The Brain** — System prompts and persuasion logic in `lib/ai/prompts.ts`
2. **The Trigger** — Error messages and rate limit responses repurposed as CTA delivery mechanisms
3. **The Chameleon** — Full EN/ES localization with culturally-adapted personality
4. **The Soft Wall** — Rate limits positioned as strategic nudges toward booking
5. **The Bridge** — RAG source citations linking directly to high-value service pages

## Security

- Clerk middleware protecting all `/admin` and `/api/admin` routes
- IP-based and session-based rate limiting on the chat API
- Input validation and sanitization via `lib/security/validation.ts`
- CORS allowlist for embed widget domains
- No credentials or secrets in client-side code
