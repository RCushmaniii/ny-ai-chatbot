# Vercel Environment Variables Setup

## 🎯 How to Add Environment Variables to Vercel

You have **3 options** to get your local environment variables into Vercel:

---

## Option 1: Manual Entry (Recommended for Production)

### Step 1: Go to Vercel Dashboard

1. Visit https://vercel.com/rcushmaniii-projects/ny-ai-chatbot
2. Click **Settings** → **Environment Variables**

### Step 2: Add Each Variable

Add these variables one by one:

| Variable Name         | Value                              | Environment                      |
| --------------------- | ---------------------------------- | -------------------------------- |
| `OPENAI_API_KEY`      | `<YOUR_OPENAI_API_KEY>`            | Production, Preview, Development |
| `OPENAI_MODEL`        | `gpt-4o`                           | Production, Preview, Development |
| `AUTH_SECRET`         | `<YOUR_AUTH_SECRET>`               | Production, Preview, Development |
| `POSTGRES_URL`        | `<YOUR_POSTGRES_URL>`              | Production, Preview, Development |
| `ADMIN_EMAIL`         | `info@nyenglishteacher.com`        | Production, Preview, Development |
| `ADMIN_PASSWORD`      | `<YOUR_ADMIN_PASSWORD>`            | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://ny-ai-chatbot.vercel.app` | Production                       |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000`            | Development                      |

**For each variable:**

1. Click "Add New"
2. Enter **Name** (e.g., `OPENAI_API_KEY`)
3. Enter **Value** (copy from your `.env.local`)
4. Select environments: ✅ Production ✅ Preview ✅ Development
5. Click "Save"

---

## Option 2: Import from .env.local (Quick & Easy)

### Using Vercel CLI:

```powershell
# Install Vercel CLI if not already installed
npm i -g vercel

# Link your project (if not already linked)
vercel link

# Pull existing env vars (optional - to see what's there)
vercel env pull

# Add environment variables from .env.local
vercel env add OPENAI_API_KEY production
# Paste your key when prompted

# Or import all at once (if you have a clean .env.local)
# Note: This requires manual confirmation for each variable
```

---

## Option 3: Copy/Paste from File

### Step 1: Create a temporary file with production values

Create `vercel-env.txt` with:

```bash
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
OPENAI_MODEL=gpt-4o
AUTH_SECRET=<YOUR_AUTH_SECRET>
POSTGRES_URL=<YOUR_POSTGRES_URL>
ADMIN_EMAIL=info@nyenglishteacher.com
ADMIN_PASSWORD=<YOUR_ADMIN_PASSWORD>
NEXT_PUBLIC_APP_URL=https://ny-ai-chatbot.vercel.app
```

### Step 2: Copy values to Vercel Dashboard

1. Go to Vercel → Settings → Environment Variables
2. For each line, click "Add New"
3. Copy the variable name and value
4. Select environments
5. Save

### Step 3: Delete the temporary file

```powershell
rm vercel-env.txt
```

---

## ✅ Required Environment Variables

### Core (Required)

- ✅ `OPENAI_API_KEY` - Your OpenAI API key
- ✅ `AUTH_SECRET` - Authentication secret (32+ characters)
- ✅ `POSTGRES_URL` - NEON database connection string
- ✅ `ADMIN_EMAIL` - Admin login email
- ✅ `ADMIN_PASSWORD` - Admin login password

### Optional (Recommended)

- ✅ `OPENAI_MODEL` - Model to use (default: gpt-4o)
- ✅ `NEXT_PUBLIC_APP_URL` - Your production URL
- ✅ `AUTH_TRUST_HOST` - Set to `true` for production

---

## 🔒 Security Best Practices

### ✅ DO:

- Use Vercel's environment variable dashboard
- Set different values for Production/Preview/Development
- Use strong passwords
- Rotate secrets regularly

### ❌ DON'T:

- Commit `.env.local` to Git (it's already in `.gitignore`)
- Share your `.env.local` file
- Use the same `AUTH_SECRET` across projects
- Hardcode secrets in your code

---

## 🎯 After Adding Variables

### 1. Trigger a Redeploy

- Go to Vercel Dashboard → Deployments
- Click "Redeploy" on the latest deployment
- Or push a new commit to GitHub

### 2. Verify Variables Are Set

```powershell
# Using Vercel CLI
vercel env ls
```

### 3. Test Your App

- Visit your production URL
- Try logging in to `/admin`
- Test the chatbot
- Check analytics

---

## 📋 Quick Checklist

Before deploying, make sure:

- [ ] All required environment variables added to Vercel
- [ ] `NEXT_PUBLIC_APP_URL` points to your production domain
- [ ] `POSTGRES_URL` is correct (NEON connection string)
- [ ] `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set
- [ ] Database migrations have been run
- [ ] Admin user has been created

---

## 🆘 Troubleshooting

### "Missing environment variable" error

- Check Vercel Dashboard → Settings → Environment Variables
- Make sure the variable is set for the correct environment (Production/Preview/Development)
- Redeploy after adding variables

### "Database connection failed"

- Verify `POSTGRES_URL` is correct
- Check NEON dashboard for connection string
- Ensure pgvector extension is installed

### "Admin login doesn't work"

- Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in Vercel
- Make sure admin user was created with `pnpm create-admin`
- Check `AUTH_SECRET` is set

---

## 🚀 Recommended Approach

**For your first deployment, use Option 1 (Manual Entry):**

1. It's the most reliable
2. You can verify each variable
3. You can set different values per environment
4. It's the official Vercel recommendation

**Time required:** ~5 minutes

---

## 📞 Need Help?

- Vercel Docs: https://vercel.com/docs/environment-variables
- NEON Docs: https://neon.tech/docs/connect/connect-from-any-app
- OpenAI API Keys: https://platform.openai.com/api-keys
