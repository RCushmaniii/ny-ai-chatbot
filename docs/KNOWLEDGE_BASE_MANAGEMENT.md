# Knowledge Base Management

## Overview

The chatbot's knowledge base consists of two types of content:

1. **Website Content** - Automatically scraped from your website sitemap
2. **Manual Content** - Documents and text you upload directly

This document explains how to manage both types of content, especially when you make significant updates to your website.

---

## 🔄 Rebuild Knowledge Base

### What It Does

The "Rebuild Knowledge Base" feature:

- ✅ Clears all existing website content
- ✅ Re-crawls your entire website using the sitemap
- ✅ Extracts and chunks all page content
- ✅ Generates embeddings for semantic search
- ✅ Stores everything in the database

### When to Use

Use this feature when you've made **significant updates** to your website:

- Updated homepage wording
- Added new landing pages
- Modified blog posts
- Added new sections (like your new "free lessons" section)
- Changed service descriptions
- Updated pricing or offerings

### How to Use

1. **Go to Admin Dashboard** → **Website Scraping** tab
2. **Click "Rebuild Knowledge Base (Clear & Re-crawl)"**
3. **Confirm** the action in the dialog
4. **Wait** for the process to complete (typically 5-15 minutes depending on site size)
5. **Check the results** - You'll see:
   - URLs found in sitemap
   - Pages successfully processed
   - Chunks created for search
   - Any errors encountered

### Example Workflow

```
You update your website:
  ↓
Homepage reworded
New "free lessons" section added
Blog posts updated
  ↓
Go to Admin → Website Scraping
  ↓
Click "Rebuild Knowledge Base"
  ↓
Confirm dialog
  ↓
Wait for completion
  ↓
Chatbot now has fresh knowledge!
```

---

## 📝 Manual Content

### What It Is

Content you manually upload to the chatbot that isn't on your website:

- PDF documents
- Text snippets
- Lesson materials
- Special instructions
- Anything not publicly available

### How to Add

1. **Go to Admin Dashboard** → **Manual Content** tab
2. **Upload file or paste text**
3. **Add metadata** (optional)
4. **Submit**

### Important Notes

- Manual content is **kept separate** from website content
- Manual content is **NOT affected** by rebuilds
- Use this for proprietary or private information
- Ideal for lesson materials, internal docs, etc.

---

## 🔍 How Search Works

When a user asks a question:

1. **Search website content first** (from sitemap crawl)
2. **If no results found**, search manual content
3. **Return best matches** with sources

This means website content takes priority, but manual content acts as a fallback.

---

## 📊 Content Statistics

In the **Website Scraping** tab, you can see:

- **Website Content**: Number of chunks from your website
- **Manual Content**: Number of items you've uploaded

Click **"Load Knowledge Base Stats"** to refresh these numbers.

---

## ⚙️ Technical Details

### Sitemap URL

Default: `https://www.nyenglishteacher.com/sitemap-0.xml`

The system:

- Fetches your XML sitemap
- Filters for English (`/en/`) and Spanish (`/es/`) pages
- Crawls each page
- Extracts text content
- Splits into 1000-character chunks (with 200-char overlap)
- Generates embeddings using OpenAI's `text-embedding-3-small`

### Database Storage

- **Table**: `documents` (Drizzle ORM)
- **Fields**: content, url, embedding, metadata
- **Metadata**: title, description, language, source, scraped_at

### Cost

- Embeddings: ~$0.02 per 1M tokens
- For a typical website: ~$0.01-0.05 per rebuild

---

## 🚨 Troubleshooting

### Rebuild Takes Too Long

- Large websites (1000+ pages) may take 10-15 minutes
- This is normal - embeddings take time to generate
- Don't close the browser tab while rebuilding

### Some Pages Not Included

- Check your sitemap is valid
- Verify pages are in `/en/` or `/es/` paths
- Check for `robots.txt` restrictions
- Some pages may be blocked from crawling

### Content Not Showing in Chatbot

- Wait a few minutes after rebuild completes
- Try asking a question about a page you know was crawled
- Check the stats to confirm content was added
- Restart the chat if needed

### Rebuild Failed

- Check your internet connection
- Verify sitemap URL is correct
- Check for server errors in browser console
- Contact support if issue persists

---

## 📋 Best Practices

1. **Before major updates**: Note your current website content stats
2. **After updates**: Rebuild knowledge base
3. **Test thoroughly**: Ask questions about new content
4. **Monitor stats**: Check that content count increased
5. **Keep manual content**: Don't delete manual uploads during rebuild

---

## 🔐 Admin-Only Feature

The rebuild feature is **admin-only** and requires:

- Authentication with admin email
- Access to the admin dashboard
- POST permission to `/api/admin/knowledge/rebuild`

---

**Last Updated:** December 10, 2025  
**Version:** 1.0.0
