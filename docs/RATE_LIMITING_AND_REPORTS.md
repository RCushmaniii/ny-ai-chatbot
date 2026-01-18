# Rate Limiting & Daily Usage Reports

## Overview

This document explains the rate limiting system and daily usage reports implemented to control costs and monitor chatbot usage.

---

## 🛡️ Rate Limiting

### Session-Based Limits

**Purpose:** Prevent individual users from excessive usage

**Limits:**

- **20 messages per chat session** for anonymous users
- **Unlimited** for authenticated admin users

**How it works:**

1. User starts a chat conversation
2. Each message is counted
3. After 20 messages, user sees friendly limit message
4. User can start a new conversation to continue

**User Experience:**

- Friendly bilingual message (EN/ES)
- Clear explanation of limit
- Link to booking page for unlimited access
- Can start new conversation immediately

### Configuration

Edit limits in `lib/config/rate-limits.ts`:

```typescript
export const RATE_LIMITS = {
  messagesPerSession: 20, // Adjust as needed
  // ... other limits
};
```

### Bypass for Admin

Admin users (logged in) have **unlimited** messages. The rate limit only applies to anonymous users.

---

## 📊 Daily Usage Reports

### Overview

Automatically sends an email report at 6 AM UTC (midnight CST) **only on days when the chatbot was used**.

### Report Contents

**Metrics:**

- Total messages
- Total chats
- Unique users (sessions)
- Estimated cost
- Average messages per chat
- Language breakdown (EN/ES)
- Top 5 questions asked

**Email Format:**

- Professional HTML email
- Visual stats cards
- Cost highlighted in green
- Top questions list
- Link to admin dashboard

### Setup Requirements

#### 1. Email Service (Resend)

Sign up for [Resend](https://resend.com/) (free tier: 3,000 emails/month)

Add to Vercel environment variables:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

#### 2. Admin Email

Already configured in `.env.local`:

```
ADMIN_EMAIL=info@nyenglishteacher.com
```

#### 3. Cron Secret (Optional)

For security, add to Vercel:

```
CRON_SECRET=your-random-secret-here
```

### Vercel Cron Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Schedule:** `0 6 * * *` = Every day at 6:00 AM UTC (midnight CST)

### Manual Testing

Test the report without waiting for cron:

```bash
# Local testing
curl http://localhost:3000/api/cron/daily-report

# Production testing (with secret)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://ny-ai-chatbot.vercel.app/api/cron/daily-report
```

---

## 💰 Cost Estimation

### How Costs are Calculated

**Estimate:** ~$0.01 per message

**Breakdown:**

- GPT-4o API call: ~$0.005
- Embedding generation: ~$0.002
- Vector search: ~$0.001
- Overhead: ~$0.002

**Example Costs:**

- 100 messages/day = ~$1.00/day = ~$30/month
- 500 messages/day = ~$5.00/day = ~$150/month
- 1,000 messages/day = ~$10.00/day = ~$300/month

### Cost Protection

**Session Limit:** 20 messages × $0.01 = $0.20 per user max

**Daily Budget:** With 50 users/day:

- 50 users × 20 messages × $0.01 = $10/day max
- ~$300/month maximum

---

## 📧 Email Report Example

```
Subject: 📊 Daily Chatbot Report - 2025-12-10 ($2.50 spent)

┌─────────────────────────────────────┐
│  Total Messages: 250                │
│  Total Chats: 45                    │
│  Unique Users: 38                   │
│  Estimated Cost: $2.50              │
└─────────────────────────────────────┘

📈 Engagement Metrics
Average Messages per Chat: 5.6

🌍 Language Breakdown
English: 180 messages (72%)
Spanish: 70 messages (28%)

💬 Top Questions
1. "How much does coaching cost?" (12 times)
2. "Do you offer group classes?" (8 times)
3. "What is your teaching method?" (6 times)
...
```

---

## 🔧 Troubleshooting

### No Email Received

**Check:**

1. `RESEND_API_KEY` is set in Vercel
2. `ADMIN_EMAIL` is set in Vercel
3. Chatbot was actually used yesterday
4. Check Vercel Cron logs
5. Check spam folder

### Cron Not Running

**Verify:**

1. `vercel.json` is in root directory
2. Cron is enabled in Vercel dashboard
3. Check Vercel → Settings → Cron Jobs

### Wrong Cost Estimates

**Adjust** the cost per message in `lib/reports/daily-usage.ts`:

```typescript
// Line ~95
const estimatedCost = totalMessages * 0.01; // Change 0.01 to actual cost
```

---

## 🎯 Future Enhancements

### Phase 2: IP-Based Limits

- Track requests per IP address
- Prevent bot attacks
- Limit sessions per IP per day

### Phase 3: Cost Circuit Breaker

- Monitor real-time OpenAI spend
- Auto-disable if budget exceeded
- Send alert emails

### Phase 4: Advanced Analytics

- Weekly/monthly reports
- Trend analysis
- User retention metrics
- Conversion tracking

---

## 📝 Configuration Summary

### Environment Variables Needed

```bash
# Required for rate limiting (already have)
POSTGRES_URL=postgresql://...

# Required for daily reports
RESEND_API_KEY=re_xxxxxxxxxxxxx
ADMIN_EMAIL=info@nyenglishteacher.com

# Optional for security
CRON_SECRET=your-random-secret
```

### Files Created

- `lib/config/rate-limits.ts` - Rate limit configuration
- `lib/reports/daily-usage.ts` - Report generation logic
- `app/api/cron/daily-report/route.ts` - Cron endpoint
- `vercel.json` - Cron schedule configuration

### Files Modified

- `app/(chat)/api/chat/route.ts` - Added rate limit check

---

## ✅ Testing Checklist

- [ ] Rate limit works after 20 messages
- [ ] Admin bypass works (unlimited messages)
- [ ] Bilingual limit messages display correctly
- [ ] Daily report generates with test data
- [ ] Email sends successfully
- [ ] Email only sends on days with activity
- [ ] Cron job runs at scheduled time
- [ ] Cost estimates are reasonable

---

## ✅ Implementation Status

### Completed (December 10, 2025)

- ✅ Session-based rate limiting (20 messages per session)
- ✅ Bilingual limit messages (English & Spanish)
- ✅ Admin bypass (unlimited messages for authenticated users)
- ✅ Daily usage report generation
- ✅ Email sending via Resend API
- ✅ Conditional email (only on days with activity)
- ✅ Vercel Cron job scheduled (6 AM UTC / midnight CST)
- ✅ Database migrations applied
- ✅ Middleware configured to allow cron endpoints
- ✅ All tests passing

### Verified Working

```bash
# Test cron endpoint
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://ny-ai-chatbot.vercel.app/api/cron/daily-report

# Expected response (no activity):
# {"success":true,"message":"No activity to report","date":"2025-12-10"}

# Expected response (with activity):
# {"success":true,"message":"Report sent successfully","stats":{...}}
```

### Environment Variables Required

Set in Vercel dashboard:

- `RESEND_API_KEY` - Email service API key
- `CRON_SECRET` - Optional, for securing cron endpoint
- `ADMIN_EMAIL` - Already set to info@nyenglishteacher.com

### Files Created

- `lib/config/rate-limits.ts` - Rate limit configuration
- `lib/reports/daily-usage.ts` - Report generation & email logic
- `app/api/cron/daily-report/route.ts` - Cron job endpoint
- `vercel.json` - Cron schedule configuration

### Files Modified

- `app/(chat)/api/chat/route.ts` - Added rate limit check
- `middleware.ts` - Excluded cron endpoints from auth
- `package.json` - Updated lint scripts to use biome directly
- `biome.jsonc` - Removed ultracite dependency

---

**Last Updated:** December 10, 2025  
**Version:** 1.0.0 - Production Ready
