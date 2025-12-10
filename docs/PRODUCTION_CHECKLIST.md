# 🚀 Production Checklist - NY AI Chatbot

**Target:** Rock-solid, bilingual RAG chatbot for nyenglishteacher.com

---

## ✅ Phase 1: Security & Safety (CRITICAL)

### 🔒 Input Validation

- [x] Message length limits (max 2000 chars)
- [x] Prompt injection detection
- [x] Input sanitization
- [ ] **TODO:** Apply validation to `/api/chat` route
- [ ] **TODO:** Apply validation to embed widget

### 🚦 Rate Limiting

- [x] Per-minute limits (10 messages/min)
- [x] Per-hour limits (50 messages/hour)
- [x] IP-based tracking
- [ ] **TODO:** Integrate into API routes
- [ ] **TODO:** Add Redis for distributed rate limiting (production)

### 🌐 CORS Configuration

- [x] Allowed origins list
- [x] CORS headers helper
- [x] Preflight request handler
- [ ] **TODO:** Apply to all API routes
- [ ] **TODO:** Verify nyenglishteacher.com domain

### 🔐 Environment Variables

- [x] `.env.example` template created
- [ ] **TODO:** Verify no secrets in git history
- [ ] **TODO:** Update `.env.local` with production values
- [ ] **TODO:** Set ADMIN_EMAIL to your real email

### 🛡️ Error Handling

- [ ] **TODO:** Never expose internal errors to users
- [ ] **TODO:** Log errors server-side only
- [ ] **TODO:** Graceful degradation (if AI fails, show friendly message)
- [ ] **TODO:** Add Sentry or error tracking service

---

## 🌐 Phase 2: Bilingual Support (HIGH PRIORITY)

### ✅ Current State

- [x] Prompt instructs AI to match user's language
- [x] Knowledge base has English content
- [ ] **TODO:** Add Spanish knowledge base content
- [ ] **TODO:** Test Spanish conversations
- [ ] **TODO:** Verify Spanish URL detection works

### 📝 Spanish Content Needed

- [ ] **TODO:** Scrape `/es/` pages from nyenglishteacher.com
- [ ] **TODO:** Add Spanish FAQs
- [ ] **TODO:** Add Spanish service descriptions
- [ ] **TODO:** Add Spanish pricing info
- [ ] **TODO:** Add Spanish testimonials

### 🔧 Implementation Tasks

- [ ] **TODO:** Update `scripts/ingest.ts` to handle `/es/` URLs
- [ ] **TODO:** Add language detection to knowledge base search
- [ ] **TODO:** Test bilingual conversations (switch mid-chat)
- [ ] **TODO:** Verify booking URL works in both languages

### 🎯 Embed Widget Language Support

- [ ] **TODO:** Detect page language from URL (`/en/` vs `/es/`)
- [ ] **TODO:** Show Spanish suggested questions on `/es/` pages
- [ ] **TODO:** Update placeholder text based on language
- [ ] **TODO:** Test widget on both English and Spanish pages

---

## 📚 Phase 3: Knowledge Base Quality

### ✅ Current State

- [x] Website scraping works (48 pages, 193 chunks)
- [x] Manual content upload works
- [x] Vector search with pgvector
- [x] Source attribution (URLs in responses)

### 🔍 Content Audit

- [ ] **TODO:** Review all scraped content for accuracy
- [ ] **TODO:** Remove duplicate/low-quality chunks
- [ ] **TODO:** Add missing FAQs
- [ ] **TODO:** Add pricing details (500 MXN, 25 USD)
- [ ] **TODO:** Add booking process details
- [ ] **TODO:** Add testimonials with client names

### 🎯 RAG Optimization

- [ ] **TODO:** Test similarity thresholds (currently 0.5 for website, 0.6 for manual)
- [ ] **TODO:** Verify chunk sizes are optimal (1000 chars for website, 1500 for manual)
- [ ] **TODO:** Add metadata filtering (language, content type)
- [ ] **TODO:** Implement hybrid search (keyword + semantic)

### 📊 Testing

- [ ] **TODO:** Test 20+ common questions
- [ ] **TODO:** Verify all answers include source URLs
- [ ] **TODO:** Check for hallucinations (AI making things up)
- [ ] **TODO:** Test edge cases (typos, Spanish, mixed language)

---

## 🎨 Phase 4: User Experience

### 💬 Chat Interface

- [x] Streaming responses
- [x] Message history
- [x] Suggested questions
- [ ] **TODO:** Add typing indicator
- [ ] **TODO:** Add "New chat" button
- [ ] **TODO:** Improve mobile responsiveness
- [ ] **TODO:** Add accessibility (ARIA labels, keyboard nav)

### 🔌 Embed Widget

- [x] Basic widget works
- [x] Customizable colors
- [x] Suggested questions
- [ ] **TODO:** Add minimize/maximize animation
- [ ] **TODO:** Add notification badge (new message)
- [ ] **TODO:** Remember chat state (localStorage)
- [ ] **TODO:** Add "Powered by NY English" branding

### 📱 Mobile Optimization

- [ ] **TODO:** Test on iPhone Safari
- [ ] **TODO:** Test on Android Chrome
- [ ] **TODO:** Fix any layout issues
- [ ] **TODO:** Optimize touch targets (min 44x44px)

---

## 🚀 Phase 5: Deployment & Monitoring

### 📦 Pre-Deployment

- [ ] **TODO:** Run production build locally (`pnpm build`)
- [ ] **TODO:** Test production build (`pnpm start`)
- [ ] **TODO:** Check all environment variables
- [ ] **TODO:** Verify database migrations run
- [ ] **TODO:** Test embed widget on staging site

### 🌐 Vercel Deployment

- [ ] **TODO:** Connect GitHub repo to Vercel
- [ ] **TODO:** Set environment variables in Vercel dashboard
- [ ] **TODO:** Configure custom domain: `chat.nyenglishteacher.com`
- [ ] **TODO:** Enable automatic deployments from `main` branch
- [ ] **TODO:** Set up preview deployments for testing

### 📊 Monitoring

- [ ] **TODO:** Set up Vercel Analytics
- [ ] **TODO:** Add error tracking (Sentry, LogRocket, or similar)
- [ ] **TODO:** Monitor OpenAI API usage
- [ ] **TODO:** Track chat metrics (messages/day, avg response time)
- [ ] **TODO:** Set up uptime monitoring (UptimeRobot, Pingdom)

### 🔔 Alerts

- [ ] **TODO:** Alert on high error rate
- [ ] **TODO:** Alert on API quota exceeded
- [ ] **TODO:** Alert on database connection failures
- [ ] **TODO:** Alert on slow response times (>5s)

---

## 🧪 Phase 6: Testing & QA

### ✅ Functional Testing

- [ ] **TODO:** Test all suggested questions
- [ ] **TODO:** Test booking flow
- [ ] **TODO:** Test pricing questions
- [ ] **TODO:** Test service questions
- [ ] **TODO:** Test FAQ questions
- [ ] **TODO:** Test edge cases (empty message, very long message)

### 🌐 Bilingual Testing

- [ ] **TODO:** Test English conversation
- [ ] **TODO:** Test Spanish conversation
- [ ] **TODO:** Test language switching mid-chat
- [ ] **TODO:** Test Spanish special characters (ñ, á, é, í, ó, ú)

### 🔒 Security Testing

- [ ] **TODO:** Test rate limiting (send 11 messages in 1 minute)
- [ ] **TODO:** Test prompt injection attempts
- [ ] **TODO:** Test CORS (try from unauthorized domain)
- [ ] **TODO:** Test SQL injection (should be prevented by Drizzle ORM)

### 📱 Cross-Browser Testing

- [ ] **TODO:** Chrome (desktop)
- [ ] **TODO:** Firefox (desktop)
- [ ] **TODO:** Safari (desktop)
- [ ] **TODO:** Edge (desktop)
- [ ] **TODO:** Safari (iOS)
- [ ] **TODO:** Chrome (Android)

---

## 📋 Phase 7: Documentation

### 📖 User Documentation

- [ ] **TODO:** Create FAQ for common issues
- [ ] **TODO:** Document how to use the chatbot
- [ ] **TODO:** Add privacy policy link
- [ ] **TODO:** Add terms of service link

### 🔧 Technical Documentation

- [x] README.md exists
- [ ] **TODO:** Update README with deployment instructions
- [ ] **TODO:** Document environment variables
- [ ] **TODO:** Document knowledge base update process
- [ ] **TODO:** Document troubleshooting steps

### 🎓 Admin Guide

- [ ] **TODO:** How to add new knowledge base content
- [ ] **TODO:** How to update suggested questions
- [ ] **TODO:** How to change bot personality
- [ ] **TODO:** How to monitor usage

---

## 🎯 Phase 8: Optimization

### ⚡ Performance

- [ ] **TODO:** Optimize database queries (add indexes)
- [ ] **TODO:** Implement caching for knowledge base results
- [ ] **TODO:** Optimize vector search (tune IVFFlat parameters)
- [ ] **TODO:** Lazy-load embed widget script

### 💰 Cost Optimization

- [ ] **TODO:** Monitor OpenAI API costs
- [ ] **TODO:** Implement response caching for common questions
- [ ] **TODO:** Use smaller embedding model if possible
- [ ] **TODO:** Set up billing alerts

### 📊 Analytics

- [ ] **TODO:** Track most asked questions
- [ ] **TODO:** Track knowledge gaps (questions with no good answer)
- [ ] **TODO:** Track conversion rate (chats → bookings)
- [ ] **TODO:** Track user satisfaction (thumbs up/down)

---

## 🔄 Phase 9: Maintenance Plan

### 📅 Weekly Tasks

- [ ] Review error logs
- [ ] Check API usage
- [ ] Review unanswered questions
- [ ] Update knowledge base if needed

### 📅 Monthly Tasks

- [ ] Review analytics
- [ ] Update suggested questions based on data
- [ ] Test all critical flows
- [ ] Update dependencies

### 📅 Quarterly Tasks

- [ ] Full security audit
- [ ] Performance review
- [ ] Cost analysis
- [ ] Feature planning

---

## 🎉 Launch Checklist

### Pre-Launch (Day Before)

- [ ] All critical items above completed
- [ ] Staging environment tested thoroughly
- [ ] Backup plan ready (rollback procedure)
- [ ] Team notified of launch

### Launch Day

- [ ] Deploy to production
- [ ] Verify all environment variables
- [ ] Test chatbot on live site
- [ ] Monitor for errors
- [ ] Be ready to rollback if needed

### Post-Launch (First Week)

- [ ] Monitor usage daily
- [ ] Respond to any issues immediately
- [ ] Collect user feedback
- [ ] Make quick fixes as needed

---

## 📞 Support Plan

### Issue Response Times

- **Critical (chatbot down):** 1 hour
- **High (major bug):** 4 hours
- **Medium (minor bug):** 24 hours
- **Low (enhancement):** 1 week

### Escalation

1. Check error logs
2. Check Vercel deployment status
3. Check OpenAI API status
4. Check database connection
5. Rollback if necessary

---

**Last Updated:** December 2, 2025  
**Status:** In Progress  
**Target Launch:** TBD
