# 🚀 Embed Instructions - NY AI Chatbot

## **Bilingual Chatbot Widget for Your Website**

Your chatbot is now ready to embed on **nyenglishteacher.com** with full English and Spanish support!

---

## **📍 Demo Pages**

Test the widget before embedding:

- **English Demo:** `http://localhost:3000/demo`
- **Spanish Demo:** `http://localhost:3000/es/demo`

---

## **🔧 How to Embed on Your Website**

### **Option 1: Automatic Language Detection (Recommended)**

The widget automatically detects the page language from the URL:

- Pages with `/en/` → Shows English UI
- Pages with `/es/` → Shows Spanish UI

**Add this code to your FAQ pages:**

```html
<!-- English FAQ page (/en/faq) -->
<iframe
  src="https://chat.nyenglishteacher.com/embed/chat"
  width="100%"
  height="600px"
  frameborder="0"
  title="NY English Teacher Chat Assistant"
></iframe>
```

```html
<!-- Spanish FAQ page (/es/faq) -->
<iframe
  src="https://chat.nyenglishteacher.com/embed/chat"
  width="100%"
  height="600px"
  frameborder="0"
  title="Asistente de Chat NY English Teacher"
></iframe>
```

The widget will automatically detect the language from `document.referrer`.

---

### **Option 2: Manual Language Selection**

If automatic detection doesn't work, you can specify the language explicitly:

```html
<!-- Force Spanish -->
<iframe
  src="https://chat.nyenglishteacher.com/embed/chat?lang=es"
  width="100%"
  height="600px"
  frameborder="0"
></iframe>
```

```html
<!-- Force English -->
<iframe
  src="https://chat.nyenglishteacher.com/embed/chat?lang=en"
  width="100%"
  height="600px"
  frameborder="0"
></iframe>
```

---

## **🎨 Customization Options**

### **Widget Size**

Adjust the `height` to fit your page layout:

```html
<!-- Tall widget -->
<iframe src="..." height="700px"></iframe>

<!-- Short widget -->
<iframe src="..." height="500px"></iframe>

<!-- Full height -->
<iframe src="..." height="100vh"></iframe>
```

### **Responsive Width**

```html
<!-- Full width -->
<iframe src="..." width="100%"></iframe>

<!-- Fixed width -->
<iframe src="..." width="400px"></iframe>

<!-- Max width with centering -->
<div style="max-width: 600px; margin: 0 auto;">
  <iframe src="..." width="100%"></iframe>
</div>
```

---

## **🌐 What's Included**

### **English Widget:**

- Welcome: "Welcome! 👋"
- Subtitle: "How can I help you today?"
- Placeholder: "Type your message..."
- Suggested Questions:
  - "What are the prices for classes?"
  - "What services do you offer?"
  - "How do I book a session?"

### **Spanish Widget:**

- Welcome: "¡Bienvenido! 👋"
- Subtitle: "¿Cómo puedo ayudarte hoy?"
- Placeholder: "Escribe tu mensaje..."
- Suggested Questions:
  - "¿Cuáles son los precios de las clases?"
  - "¿Qué servicios ofreces?"
  - "¿Cómo reservo una sesión?"

---

## **🧠 Knowledge Base**

The chatbot has access to:

- ✅ **308 Spanish chunks** from `/es/` pages
- ✅ **298 English chunks** from `/en/` pages
- ✅ **117 unique URLs** from your website

**Content includes:**

- Services and offerings
- Pricing information
- Booking process
- About information
- Blog posts
- Testimonials

---

## **🔒 Security Features**

Your chatbot includes production-grade security:

- ✅ **Rate Limiting:** 10 messages/min, 50 messages/hour per IP
- ✅ **Input Validation:** Prevents malicious input
- ✅ **Prompt Injection Protection:** Blocks manipulation attempts
- ✅ **CORS Protection:** Only nyenglishteacher.com allowed
- ✅ **Content Sanitization:** Cleans user input

---

## **📊 How It Works**

1. **User asks a question** (in English or Spanish)
2. **AI detects the language** and responds in the same language
3. **Searches knowledge base** for relevant information
4. **Provides answer** with source URLs from your website
5. **Maintains conversation** context for follow-up questions

---

## **🚀 Deployment Checklist**

### **Before Going Live:**

- [ ] Test on English FAQ page (`/en/faq`)
- [ ] Test on Spanish FAQ page (`/es/faq`)
- [ ] Verify suggested questions work
- [ ] Verify answers include source URLs
- [ ] Test on mobile devices
- [ ] Test rate limiting (try sending 11 messages quickly)
- [ ] Verify CORS (widget only works on your domain)

### **After Deployment:**

- [ ] Monitor chat logs in admin dashboard
- [ ] Review unanswered questions
- [ ] Update knowledge base as needed
- [ ] Check analytics for usage patterns

---

## **🛠️ Admin Dashboard**

Manage your chatbot at: `https://chat.nyenglishteacher.com/admin`

**Features:**

- **Website Scraping:** Re-crawl your site to update knowledge
- **Manual Content:** Add custom FAQs and information
- **Bot Settings:** Customize suggested questions
- **Instructions:** Modify bot personality and behavior
- **Embed Code:** Get the embed code for your site

---

## **📞 Support**

If you need help:

1. Check the admin dashboard for stats
2. Review `PRODUCTION_CHECKLIST.md` for troubleshooting
3. Test locally first: `http://localhost:3000/embed/chat?lang=es`

---

## **🎯 Next Steps**

1. **Test locally:**

   - Visit `http://localhost:3000/es/demo`
   - Try the suggested questions
   - Verify Spanish responses

2. **Deploy to production:**

   - Push to GitHub
   - Deploy to Vercel
   - Configure domain: `chat.nyenglishteacher.com`

3. **Embed on your site:**
   - Add iframe to FAQ pages
   - Test on staging first
   - Deploy to production

---

**Your bilingual chatbot is ready! 🎉**
