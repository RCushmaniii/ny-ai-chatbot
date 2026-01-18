# NY English Teacher Chat Widget - Integration Guide

## Overview

This document provides technical specifications for integrating the NY English Teacher chat widget into external websites (e.g., nyenglishteacher.com).

---

## Quick Start

Add this script tag before the closing `</body>` tag:

```html
<script src="https://ny-ai-chatbot.vercel.app/api/embed?v=3"></script>
```

That's it. The widget will automatically:
- Display a floating chat button (bottom-right)
- Show the custom Statue of Liberty icon
- Open an iframe-based chat when clicked
- Auto-detect language from URL path (`/es/` = Spanish, `/en/` = English)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR WEBSITE (nyenglishteacher.com)                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  <script src="ny-ai-chatbot.vercel.app/api/embed">        │  │
│  │                                                           │  │
│  │  This script:                                             │  │
│  │  1. Creates floating button (position: fixed)             │  │
│  │  2. Loads icon from /images/chatbot-icon.jpg              │  │
│  │  3. On click, creates iframe pointing to /embed/chat      │  │
│  │  4. Fetches settings from /api/embed/settings             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  <iframe src="ny-ai-chatbot.vercel.app/embed/chat">       │  │
│  │                                                           │  │
│  │  The chat interface (loaded when button clicked)          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CHATBOT APP (ny-ai-chatbot.vercel.app)                         │
│                                                                 │
│  Endpoints:                                                     │
│  ├── GET  /api/embed          → Returns embed JavaScript        │
│  ├── GET  /api/embed/settings → Returns widget configuration    │
│  ├── GET  /api/embed/chat     → Chat API (POST messages)        │
│  ├── GET  /embed/chat         → Chat UI (iframe content)        │
│  └── GET  /images/chatbot-icon.jpg → Bot icon image             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Endpoints Reference

### 1. Embed Script
```
GET https://ny-ai-chatbot.vercel.app/api/embed
```

Returns self-executing JavaScript that creates the widget. Cache: 5 minutes.

**Query Parameters:**
| Param | Description |
|-------|-------------|
| `v` | Cache buster (e.g., `?v=3`) - increment to force fresh load |
| `id` | Bot ID (optional, defaults to "default") |

### 2. Settings API
```
GET https://ny-ai-chatbot.vercel.app/api/embed/settings
```

Returns JSON configuration:
```json
{
  "buttonColor": "#4f46e5",
  "buttonSize": 1.0,
  "position": "bottom-right",
  "welcomeMessage": "",
  "showWelcomeMessage": false,
  "placeholder": "Type your message...",
  "botIcon": "https://ny-ai-chatbot.vercel.app/images/chatbot-icon.jpg",
  "suggestedQuestions": [
    "What are the prices for classes?",
    "What services do you offer?",
    "How do I book a session?"
  ]
}
```

### 3. Chat Iframe
```
GET https://ny-ai-chatbot.vercel.app/embed/chat
```

The chat interface loaded in an iframe. Supports query params:
| Param | Description |
|-------|-------------|
| `lang` | Force language: `en` or `es` |

### 4. Chat API
```
POST https://ny-ai-chatbot.vercel.app/api/embed/chat
Content-Type: application/json

{
  "chatId": "unique-session-id",
  "message": "User's message"
}
```

---

## Script Attributes

Customize the widget by adding `data-*` attributes to the script tag:

```html
<script
  src="https://ny-ai-chatbot.vercel.app/api/embed?v=3"
  data-language="es"
  data-position="bottom-right"
  data-button-color="#4f46e5"
  data-show-welcome-message="false"
  data-open="false"
></script>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-language` | `en` \| `es` | auto-detect | Force widget language |
| `data-position` | `bottom-right` \| `bottom-left` | `bottom-right` | Button position |
| `data-button-color` | hex color | `#4f46e5` | Button background color |
| `data-button-size` | number | `1` | Button scale (0.5 = 50%, 2 = 200%) |
| `data-show-welcome-message` | `true` \| `false` | `false` | Show welcome popup |
| `data-welcome-message` | string | varies by lang | Custom welcome text |
| `data-open` | `true` \| `false` | `false` | Auto-open chat on load |
| `data-open-delay` | ms | `5000` | Delay before auto-open |
| `data-placeholder` | string | varies by lang | Input placeholder text |

---

## CORS Configuration

The chatbot allows requests from these origins:

```
https://www.nyenglishteacher.com
https://nyenglishteacher.com
https://ny-eng.vercel.app
https://chat.nyenglishteacher.com
```

If embedding on a new domain, it must be added to `lib/security/cors.ts` or the `ALLOWED_ORIGINS` environment variable.

---

## Caching & Cache Busting

### Problem
The embed script is cached for 5 minutes. Browsers and CDNs may cache longer.

### Solution
Add a version parameter to force fresh load:

```html
<!-- Change v=3 to v=4, v=5, etc. to bust cache -->
<script src="https://ny-ai-chatbot.vercel.app/api/embed?v=3"></script>
```

### Cloudflare Users
If using Cloudflare, also purge cache for:
- `https://ny-ai-chatbot.vercel.app/api/embed`
- `https://ny-ai-chatbot.vercel.app/api/embed/settings`

---

## Troubleshooting

### Widget Not Appearing
1. Check browser console for errors
2. Verify script tag is before `</body>`
3. Check if domain is in CORS allowed list
4. Try incognito mode to bypass cache

### Old Icon Showing
1. Add `?v=X` parameter (increment X each time)
2. Clear browser cache
3. Clear CDN cache if applicable

### Icon Broken/Not Loading
1. Verify image loads: https://ny-ai-chatbot.vercel.app/images/chatbot-icon.jpg
2. Check for mixed content issues (HTTP vs HTTPS)
3. Check browser network tab for 404 errors

### Chat Not Working
1. Check CORS errors in console
2. Verify origin is in allowed list
3. Test at: https://ny-ai-chatbot.vercel.app/test-widget

---

## Testing

### Test Page
```
https://ny-ai-chatbot.vercel.app/test-widget
```

### Direct Chat
```
https://ny-ai-chatbot.vercel.app/embed/chat
```

### Verify Settings
```
https://ny-ai-chatbot.vercel.app/api/embed/settings
```

### Verify Icon
```
https://ny-ai-chatbot.vercel.app/images/chatbot-icon.jpg
```

---

## Implementation Checklist

- [ ] Add script tag before `</body>`
- [ ] Use `?v=X` parameter for cache busting
- [ ] Verify domain is in CORS allowed list
- [ ] Test in incognito mode
- [ ] Verify icon loads correctly
- [ ] Test chat functionality
- [ ] Test language detection (visit `/es/` and `/en/` pages)

---

## Support

- **Repo**: https://github.com/RCushmaniii/ny-ai-chatbot
- **Test Page**: https://ny-ai-chatbot.vercel.app/test-widget
