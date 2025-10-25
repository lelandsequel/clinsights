# AI Insights Hub by C&L Strategy

> **Strategic Intelligence, Delivered Daily**

A production-ready AI news aggregator dashboard that automatically curates, categorizes, and delivers the most important AI news from top sources. Built for C&L Strategy consulting firm.

![AI Insights Hub](https://img.shields.io/badge/Status-Production-success)
![License](https://img.shields.io/badge/License-Proprietary-red)

## 🌟 Features

### Core Functionality
- **Automated News Aggregation** - Fetches AI news from 9+ premium sources (TechCrunch, ArXiv, The Verge, OpenAI, etc.)
- **AI-Powered Categorization** - Automatically categorizes articles into Breakthroughs, Company Announcements, Policy, Funding, Research
- **Industry-Specific Filtering** - Filter news by Oil & Gas, Medical, Hospitality, Real Estate, Education, Finance, Technology, Manufacturing, Retail
- **Relevance Scoring** - AI ranks articles by importance and impact (0-100 score)
- **URL Validation** - Automatically filters out broken links during aggregation

### User Experience
- **Beautiful Dark Theme** - Professional navy blue and gold C&L Strategy branding
- **Infinite Scroll** - Seamless article loading as you scroll
- **Reading Time Estimates** - Know how long each article takes to read
- **Search & Filters** - Powerful search with category, industry, and time range filters
- **Responsive Design** - Works perfectly on desktop and mobile

### Advanced Features
- **AI Article Summaries** - One-click AI-generated summaries for quick reading
- **Reading List** - Save articles to read later, mark as read
- **Bookmarks** - Favorite articles for future reference
- **Analytics Dashboard** - Trending topics, source distribution, category breakdowns
- **RSS Feed Export** - Subscribe to filtered news feeds in your RSS reader
- **Theme Toggle** - Switch between dark and light modes

### Content Strategy
- **Maximum Legal Content Extraction** - Stores full RSS content (up to 10,000 characters)
- **Enhanced Excerpts** - Rich article previews with proper attribution
- **Reader Mode API** - On-demand article fetching for seamless reading

## 🚀 Tech Stack

### Frontend
- **React 19** - Latest React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Modern utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **tRPC** - End-to-end typesafe APIs
- **Wouter** - Lightweight routing

### Backend
- **Node.js 22** - Latest LTS version
- **Express 4** - Web server framework
- **tRPC 11** - Type-safe API layer
- **Drizzle ORM** - Type-safe database queries
- **MySQL/TiDB** - Scalable database

### AI & Content
- **OpenAI GPT** - Article categorization, summarization, industry tagging
- **RSS Parser** - Multi-source news aggregation
- **Mozilla Readability** - Content extraction
- **Cheerio & JSDOM** - HTML parsing

### Infrastructure
- **Manus Platform** - Hosting and deployment
- **S3 Storage** - File storage
- **OAuth 2.0** - Secure authentication

## 📦 Installation

### Prerequisites
- Node.js 22+
- pnpm 10+
- MySQL or TiDB database

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/lelandsequel/insights.git
cd insights
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment variables**
```bash
# Database
DATABASE_URL=mysql://user:pass@host:port/database

# Authentication (Manus OAuth)
JWT_SECRET=your-jwt-secret
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-owner-openid
OWNER_NAME=your-name

# Branding
VITE_APP_TITLE=AI Insights Hub
VITE_APP_LOGO=https://your-logo-url.com/logo.png

# AI & APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
```

4. **Initialize database**
```bash
pnpm db:push
```

5. **Seed sample data** (optional)
```bash
pnpm tsx scripts/seed-data.ts
```

6. **Start development server**
```bash
pnpm dev
```

Visit `http://localhost:3000`

## 🎯 Usage

### For Administrators

**Refresh News**
```bash
# Via UI: Click "Refresh News" button in header
# Via CLI: pnpm tsx scripts/aggregate-news.ts
```

**Backfill Industry Tags**
```bash
pnpm tsx scripts/backfill-industries.ts
```

### For Users

1. **Browse News** - Scroll through curated AI news on the homepage
2. **Filter by Category** - Click category tabs (Breakthroughs, Companies, etc.)
3. **Filter by Industry** - Select industry buttons (Medical, Finance, etc.)
4. **Search** - Type keywords in the search bar
5. **Read Articles** - Click article titles for full details
6. **Generate Summaries** - Click "Generate AI Summary" on article pages
7. **Save for Later** - Use bookmark and reading list icons
8. **View Analytics** - Click "Analytics" to see trends and insights
9. **Export RSS** - Click "RSS" to subscribe to filtered feeds

## 📊 Database Schema

### Articles Table
- `id` - Primary key
- `sourceId` - Unique identifier from RSS feed
- `title` - Article headline
- `description` - Brief summary
- `content` - Full article content (up to 10,000 chars)
- `url` - Source URL
- `imageUrl` - Featured image
- `source` - Publisher name
- `author` - Article author
- `category` - AI-assigned category
- `relevanceScore` - Importance score (0-100)
- `industries` - JSON array of relevant industries
- `summary` - AI-generated summary (cached)
- `publishedAt` - Publication date
- `createdAt` - Database insertion time

### Users Table
- `id` - Primary key
- `openId` - OAuth identifier
- `name` - User name
- `email` - User email
- `role` - `admin` or `user`
- `createdAt`, `updatedAt`, `lastSignedIn`

### Reading List & Bookmarks
- User-specific saved articles
- Read/unread tracking

## 🔧 Configuration

### RSS Feed Sources

Edit `server/newsAggregator.ts` to add/remove sources:

```typescript
const RSS_FEEDS = [
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
  // Add your sources here
];
```

### Industry Categories

Edit `client/src/pages/Home.tsx`:

```typescript
const INDUSTRIES = [
  { value: 'medical', label: 'Medical' },
  // Add your industries here
];
```

## 🎨 Branding Customization

### Colors
Edit `client/src/index.css`:

```css
:root {
  --primary: 221 83% 53%; /* Navy blue */
  --accent: 38 92% 50%; /* Gold */
}
```

### Logo & Title
Set environment variables:
```bash
VITE_APP_TITLE="Your Company Name"
VITE_APP_LOGO="https://your-logo-url.com/logo.png"
```

## 📈 Performance

- **Initial Load**: < 2 seconds
- **Article Aggregation**: ~30 seconds for 100+ articles
- **AI Categorization**: ~1 second per article
- **Database Queries**: < 50ms average
- **Infinite Scroll**: Loads 12 articles per page

## 🔒 Security

- **OAuth 2.0** - Secure authentication via Manus
- **JWT Sessions** - Encrypted session cookies
- **Role-Based Access** - Admin-only features protected
- **SQL Injection Protection** - Parameterized queries via Drizzle ORM
- **XSS Prevention** - React automatic escaping
- **HTTPS** - Enforced in production

## 📝 License

**Proprietary** - © 2025 C&L Strategy. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## 🤝 Contributing

This is a private project for C&L Strategy. External contributions are not accepted.

## 📧 Support

For issues or questions, contact: support@clstrategy.com

## 🙏 Acknowledgments

- Built with [Manus Platform](https://manus.im)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- AI powered by [OpenAI](https://openai.com)

---

**Made with ❤️ by C&L Strategy**

