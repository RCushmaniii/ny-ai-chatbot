# Production Deployment Guide

## Overview

This guide covers deploying your NY AI Chatbot to production and embedding it on your website.

---

## Part 1: Deploy to Production (Vercel Recommended)

### Option A: Deploy to Vercel (Recommended - Easiest)

#### Step 1: Prepare Your Code

```powershell
# Stage all changes
git add .

# Commit everything
git commit -m "Add admin panel with analytics, chat logs, and insights"

# Push to GitHub
git push origin main
```

#### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Build Command**: `pnpm build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install` (default)

#### Step 3: Add Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

```bash
# Database
POSTGRES_URL=your_production_postgres_url

# OpenAI
OPENAI_API_KEY=your_openai_key

# Admin Auth
ADMIN_EMAIL=info@nyenglishteacher.com
ADMIN_PASSWORD=your_secure_password
AUTH_SECRET=your_auth_secret_key

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
```

#### Step 4: Deploy

- Click "Deploy"
- Vercel will build and deploy automatically
- You'll get a URL like: `https://ny-ai-chatbot.vercel.app`

#### Step 5: Run Production Migrations

After first deploy, run migrations on production database:

```powershell
# Set production database URL
$env:POSTGRES_URL = "your_production_postgres_url"

# Run all migrations
psql "$env:POSTGRES_URL" -f migrations/000_enable_extensions.sql
psql "$env:POSTGRES_URL" -f migrations/001_bot_settings_global.sql
psql "$env:POSTGRES_URL" -f migrations/002_chat_sessionid.sql
psql "$env:POSTGRES_URL" -f migrations/003_analytics_table.sql
psql "$env:POSTGRES_URL" -f migrations/004_migrate_existing_chats.sql
psql "$env:POSTGRES_URL" -f migrations/005_knowledge_events.sql

# Create admin user
pnpm create-admin
```

---

### Option B: Deploy to Other Platforms

#### Railway

1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

#### Netlify

1. Import from GitHub
2. Build command: `pnpm build`
3. Publish directory: `.next`

#### Self-Hosted (VPS)

1. Clone repo on server
2. Install dependencies: `pnpm install`
3. Build: `pnpm build`
4. Start: `pnpm start`
5. Use PM2 or systemd to keep running

---

## Part 2: Embed Chatbot on Your Website

### Method 1: Embed Widget (Recommended for Single Page)

#### Step 1: Get Embed Code

1. Go to your deployed chatbot admin: `https://your-app.vercel.app/admin`
2. Click **Embed Code** tab
3. Copy the embed code

#### Step 2: Add to Your Website Page

On your New York English Teacher website, edit the specific page where you want the chatbot:

**For Astro (your current site):**

```astro
---
// src/pages/chatbot.astro (or any page)
---

<Layout title="AI Chatbot">
  <main>
    <h1>Chat with Robert's AI Assistant</h1>

    <!-- Embed the chatbot -->
    <div id="chatbot-container" style="height: 600px;">
      <iframe
        src="https://your-app.vercel.app"
        width="100%"
        height="100%"
        frameborder="0"
        allow="clipboard-write"
        style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
      ></iframe>
    </div>
  </main>
</Layout>
```

**For HTML:**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>AI Chatbot - New York English Teacher</title>
  </head>
  <body>
    <h1>Chat with Robert's AI Assistant</h1>

    <div style="max-width: 800px; margin: 0 auto; height: 600px;">
      <iframe
        src="https://your-app.vercel.app"
        width="100%"
        height="100%"
        frameborder="0"
        allow="clipboard-write"
        style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
      ></iframe>
    </div>
  </body>
</html>
```

---

### Method 2: Floating Chat Widget (Appears on Every Page)

If you later want it on multiple pages, add this script to your site's footer:

```html
<!-- Add before </body> tag -->
<script>
  (function () {
    // Create floating button
    const button = document.createElement("button");
    button.innerHTML = "💬";
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #0070f3;
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
    `;

    // Create iframe container
    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 400px;
      height: 600px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      display: none;
      z-index: 9999;
    `;

    const iframe = document.createElement("iframe");
    iframe.src = "https://your-app.vercel.app";
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 12px;
    `;

    container.appendChild(iframe);
    document.body.appendChild(button);
    document.body.appendChild(container);

    // Toggle chat
    button.addEventListener("click", () => {
      if (container.style.display === "none") {
        container.style.display = "block";
        button.innerHTML = "✕";
      } else {
        container.style.display = "none";
        button.innerHTML = "💬";
      }
    });
  })();
</script>
```

---

### Method 3: Direct Link (Simplest)

Just add a link on your website:

```html
<a href="https://your-app.vercel.app" target="_blank">
  Chat with AI Assistant
</a>
```

---

## Part 3: Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Go to Vercel dashboard → Settings → Domains
2. Add domain: `chat.nyenglishteacher.com`
3. Update DNS records (Vercel provides instructions)
4. Update `NEXTAUTH_URL` environment variable

---

## Part 4: Post-Deployment Checklist

### ✅ Verify Everything Works

- [ ] Chatbot loads and responds
- [ ] Admin panel accessible at `/admin`
- [ ] Login works with admin credentials
- [ ] Knowledge base has content
- [ ] Analytics tracking
- [ ] Chat logs recording
- [ ] Insights collecting data

### ✅ Security

- [ ] Strong admin password set
- [ ] `AUTH_SECRET` is random and secure
- [ ] Database has proper access controls
- [ ] HTTPS enabled (automatic with Vercel)

### ✅ Performance

- [ ] Knowledge base indexed
- [ ] Embeddings generated
- [ ] Rate limiting configured

---

## Part 5: Recommended Setup for Your Site

### Best Approach for New York English Teacher:

1. **Deploy chatbot to Vercel**

   - URL: `https://ny-chatbot.vercel.app`
   - Or custom: `https://chat.nyenglishteacher.com`

2. **Create dedicated page on your Astro site**

   - Page: `https://nyenglishteacher.com/chat` or `/ai-assistant`
   - Embed full chatbot iframe
   - Add description and instructions

3. **Add navigation link**

   - Add "AI Assistant" to your main menu
   - Links to the chat page

4. **Optional: Add floating widget**
   - Only on specific pages (services, blog)
   - Not on every page (less intrusive)

---

## Part 6: Maintenance

### Regular Tasks

- **Weekly**: Check analytics and insights
- **Monthly**: Review chat logs for improvements
- **As needed**: Update knowledge base with new content

### Monitoring

- Vercel provides automatic monitoring
- Check admin panel for usage stats
- Review insights for knowledge gaps

---

## Quick Start Commands

```powershell
# 1. Commit and push
git add .
git commit -m "Production ready with all admin features"
git push origin main

# 2. Deploy to Vercel (via dashboard)
# - Import from GitHub
# - Add environment variables
# - Deploy

# 3. Run migrations on production
$env:POSTGRES_URL = "production_url"
psql "$env:POSTGRES_URL" -f migrations/000_enable_extensions.sql
# ... (run all migrations)

# 4. Create admin user
pnpm create-admin

# 5. Test
# - Visit https://your-app.vercel.app
# - Login to /admin
# - Verify everything works
```

---

## Support & Troubleshooting

### Common Issues

**Build fails on Vercel:**

- Check build logs
- Verify all dependencies in package.json
- Ensure migrations run successfully

**Database connection fails:**

- Verify POSTGRES_URL is correct
- Check database allows connections from Vercel IPs
- Ensure pgvector extension is installed

**Admin login doesn't work:**

- Verify ADMIN_EMAIL and ADMIN_PASSWORD are set
- Check AUTH_SECRET is configured
- Ensure admin user was created

**Chatbot doesn't respond:**

- Check OPENAI_API_KEY is valid
- Verify knowledge base has content
- Check API logs in Vercel

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Run migrations
3. ✅ Create admin user
4. ✅ Test chatbot
5. ✅ Embed on your website
6. ✅ Monitor and optimize

---

**You're ready to go live! 🚀**
