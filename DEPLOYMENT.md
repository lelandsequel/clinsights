# Deployment Guide - AI Insights Hub

## Quick Start Deployment to Manus

### 1. Prerequisites
- Manus account at [manus.im](https://manus.im)
- Git repository pushed to GitHub
- Database (TiDB/MySQL) provisioned

### 2. Environment Variables Setup

In your Manus project dashboard, set these environment variables:

#### Required Variables
```bash
# Database
DATABASE_URL=mysql://user:pass@host:port/database

# Authentication (Get from Manus dashboard)
JWT_SECRET=your-jwt-secret-change-in-production
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=your-manus-app-id
OWNER_OPEN_ID=your-manus-openid
OWNER_NAME=Your Name

# AI & APIs (Get from Manus dashboard)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key

# Branding
VITE_APP_TITLE="AI Insights Hub"
VITE_APP_LOGO="https://your-logo-url.com/logo.png"

# Infrastructure
PORT=3000
NODE_ENV=production
```

### 3. Database Setup

After deployment, run database migrations:

```bash
# SSH into your Manus instance or use Manus CLI
pnpm db:push
```

### 4. Initial Data Seeding (Optional)

```bash
pnpm tsx scripts/seed-data.ts
```

### 5. First News Aggregation

```bash
pnpm tsx scripts/aggregate-news.ts
```

## Build Process

The build process runs automatically on Manus:

1. **Install dependencies**: `pnpm install`
2. **Build frontend**: `vite build` → outputs to `dist/public`
3. **Build backend**: `esbuild server/_core/index.ts` → outputs to `dist/index.js`
4. **Start server**: `node dist/index.js`

## Deployment Checklist

- [ ] Environment variables configured in Manus dashboard
- [ ] Database provisioned and `DATABASE_URL` set
- [ ] `VITE_APP_ID` obtained from Manus
- [ ] `BUILT_IN_FORGE_API_KEY` obtained from Manus
- [ ] `OWNER_OPEN_ID` set to your Manus user ID
- [ ] Repository pushed to GitHub
- [ ] Manus project connected to GitHub repo
- [ ] Database migrations run (`pnpm db:push`)
- [ ] Initial news aggregated (`pnpm tsx scripts/aggregate-news.ts`)

## Post-Deployment

### Verify Deployment
1. Visit your Manus app URL
2. Login with Manus OAuth
3. Check that articles are loading
4. Test "Refresh News" button (admin only)

### Regular Maintenance
- **News Refresh**: Set up a cron job or manually run `pnpm tsx scripts/aggregate-news.ts` daily
- **Industry Backfill**: Run `pnpm tsx scripts/backfill-industries.ts` if needed

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version is 22+
- Check build logs in Manus dashboard

### App Won't Start
- Verify `DATABASE_URL` is correct
- Check that all required env vars are set
- Review server logs in Manus dashboard

### OAuth Issues
- Verify `VITE_APP_ID` matches your Manus project
- Check `OAUTH_SERVER_URL` and `VITE_OAUTH_PORTAL_URL` are correct
- Ensure `OWNER_OPEN_ID` is set

### No Articles Showing
- Run news aggregation: `pnpm tsx scripts/aggregate-news.ts`
- Check database connection
- Verify `BUILT_IN_FORGE_API_KEY` is set (needed for AI categorization)

## Support

For Manus-specific issues, contact Manus support.
For app issues, check the logs and verify environment variables.

