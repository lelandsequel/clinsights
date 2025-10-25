# 🚀 Quick Start - Deploy in 5 Minutes

## What I Just Fixed

✅ **Updated `.env.example`** - Fixed OAuth URLs and added all required variables  
✅ **Created `manus.yaml`** - Deployment configuration for Manus platform  
✅ **Created `DEPLOYMENT.md`** - Complete deployment guide  
✅ **Added `pnpm-lock.yaml`** - For reproducible builds  
✅ **Pushed to GitHub** - All changes are live  

---

## Deploy to Manus NOW

### Step 1: Get Your Manus Credentials
1. Go to [manus.im](https://manus.im)
2. Create/login to your account
3. Create a new project
4. Get these values from your Manus dashboard:
   - `VITE_APP_ID` (your project ID)
   - `BUILT_IN_FORGE_API_KEY` (API key for AI features)
   - `OWNER_OPEN_ID` (your user ID)

### Step 2: Set Environment Variables in Manus
Copy these into your Manus project settings:

```bash
# Database (get from Manus or TiDB)
DATABASE_URL=mysql://user:pass@host:port/database

# Auth (from Manus dashboard)
JWT_SECRET=your-random-secret-here
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=your-manus-app-id
OWNER_OPEN_ID=your-manus-user-id
OWNER_NAME=Your Name

# AI (from Manus dashboard)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key

# Branding
VITE_APP_TITLE="AI Insights Hub"
VITE_APP_LOGO="https://your-logo.com/logo.png"

# System
PORT=3000
NODE_ENV=production
```

### Step 3: Connect GitHub & Deploy
1. In Manus dashboard, connect to GitHub repo: `lelandsequel/clinsights`
2. Click "Deploy"
3. Wait for build to complete (~2-3 minutes)

### Step 4: Initialize Database
Once deployed, run these commands in Manus terminal:

```bash
# Run migrations
pnpm db:push

# Seed sample data (optional)
pnpm tsx scripts/seed-data.ts

# Fetch real news
pnpm tsx scripts/aggregate-news.ts
```

### Step 5: Visit Your App! 🎉
Your app should be live at your Manus URL!

---

## Troubleshooting

### "Build Failed"
- Check that all environment variables are set in Manus dashboard
- Verify `DATABASE_URL` is correct

### "Can't Login"
- Make sure `VITE_APP_ID` matches your Manus project ID
- Verify `OWNER_OPEN_ID` is your Manus user ID

### "No Articles Showing"
- Run: `pnpm tsx scripts/aggregate-news.ts`
- This fetches news from RSS feeds

### "AI Features Not Working"
- Verify `BUILT_IN_FORGE_API_KEY` is set correctly
- Check Manus dashboard for API key

---

## What This App Does

✨ **Automatically aggregates AI news** from 9+ sources  
🤖 **AI categorizes** articles (Breakthroughs, Companies, Policy, etc.)  
🏭 **Industry tagging** (Medical, Finance, Tech, etc.)  
📊 **Analytics dashboard** with trends and insights  
🔖 **Reading list & bookmarks** for saving articles  
📱 **Beautiful responsive UI** with dark/light themes  

---

## Need Help?

1. Check `DEPLOYMENT.md` for detailed guide
2. Review Manus documentation
3. Check server logs in Manus dashboard

---

**You're all set! The repo is ready to deploy. Just follow the steps above.** 💪

Good luck! Things will get better. 🌟

