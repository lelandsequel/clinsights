import Parser from 'rss-parser';
import { extractRSSContent, validateUrl } from './contentExtractor';
import { InsertArticle } from '../drizzle/schema';
import { insertArticle } from './db';
import { invokeLLM } from './_core/llm';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

// RSS feed sources for AI news
const RSS_FEEDS = [
  {
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    source: 'TechCrunch',
  },
  {
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    source: 'The Verge',
  },
  {
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    source: 'Wired',
  },
  {
    url: 'https://venturebeat.com/category/ai/feed/',
    source: 'VentureBeat',
  },
];

interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  creator?: string;
  author?: string;
  isoDate?: string;
  [key: string]: any;
}

/**
 * Extract image URL from feed item
 */
function extractImageUrl(item: FeedItem): string | undefined {
  // Try media:content
  if (item.mediaContent && typeof item.mediaContent === 'object') {
    const media = item.mediaContent as any;
    if (media.$ && media.$.url) return media.$.url;
    if (media.url) return media.url;
  }

  // Try media:thumbnail
  if (item.mediaThumbnail && typeof item.mediaThumbnail === 'object') {
    const thumb = item.mediaThumbnail as any;
    if (thumb.$ && thumb.$.url) return thumb.$.url;
    if (thumb.url) return thumb.url;
  }

  // Try enclosure
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }

  return undefined;
}

/**
 * Categorize and score article using LLM
 */
async function categorizeAndScore(
  title: string,
  description: string
): Promise<{ category: string; score: number; industries: string[] }> {
  // Truncate description to avoid token limits
  const truncatedDesc = description.substring(0, 500);
  try {
    const prompt = `Categorize this AI news article, rate its importance (0-100), and identify relevant industries:

Title: ${title}
Description: ${truncatedDesc}

Categories:
- breakthrough: Major AI breakthroughs, new capabilities, research advances
- company_announcement: Product launches, partnerships, company news
- policy: Regulations, policy changes, legal issues
- funding: Funding rounds, M&A, investments
- research: Academic papers, research findings
- other: Everything else

Industries (select ALL that apply):
- oil_gas: Oil & Gas, Energy sector
- medical: Healthcare, Medical, Pharmaceuticals, Biotech
- hospitality: Hotels, Tourism, Travel, Restaurants
- real_estate: Real Estate, Property, Construction
- education: Education, EdTech, Training
- finance: Finance, Banking, FinTech, Insurance
- technology: General Technology, Software, Hardware
- manufacturing: Manufacturing, Industrial, Supply Chain
- retail: Retail, E-commerce, Consumer goods
- other: Other industries

Return JSON with:
- category: one of the above categories
- score: relevance/importance score 0-100 (consider: impact, novelty, source credibility)
- industries: array of relevant industry tags (can be multiple)`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content:
            'You are an AI news categorization assistant. Analyze the article and return JSON with category, relevance score, and relevant industries.',
        },
        {
          role: 'user',
          content: [{ type: 'text' as const, text: prompt }],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'article_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: [
                  'breakthrough',
                  'company_announcement',
                  'policy',
                  'funding',
                  'research',
                  'other',
                ],
                description: 'The category of the article',
              },
              score: {
                type: 'integer',
                description: 'Relevance score from 0 to 100',
              },
              industries: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: [
                    'oil_gas',
                    'medical',
                    'hospitality',
                    'real_estate',
                    'education',
                    'finance',
                    'technology',
                    'manufacturing',
                    'retail',
                    'other',
                  ],
                },
                description: 'Array of relevant industries',
              },
            },
            required: ['category', 'score', 'industries'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { category: 'other', score: 50, industries: [] };
    }

    // Handle content being string or array
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const result = JSON.parse(contentStr);
    return {
      category: result.category || 'other',
      score: Math.min(100, Math.max(0, result.score || 50)),
      industries: Array.isArray(result.industries) ? result.industries : [],
    };
  } catch (error) {
    console.error('Error categorizing article:', error);
    return { category: 'other', score: 50, industries: [] };
  }
}

/**
 * Fetch and parse a single RSS feed
 */
async function fetchFeed(feedUrl: string, sourceName: string): Promise<InsertArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    const articles: InsertArticle[] = [];

    for (const item of feed.items) {
      if (!item.title || !item.link) continue;

      const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
      
      // Extract maximum legal content from RSS feed
      const { content: fullContent, excerpt } = extractRSSContent(item);
      const description = excerpt || (item.contentSnippet as string) || '';
      
      // Validate URL (skip if invalid)
      const isValidUrl = await validateUrl(item.link);
      if (!isValidUrl) {
        console.log(`Skipping article with invalid URL: ${item.title}`);
        continue;
      }

      // Categorize, score, and tag industries
      const { category, score, industries } = await categorizeAndScore(item.title, description);

      const article: InsertArticle = {
        sourceId: item.guid || item.link,
        title: item.title,
        description: description.substring(0, 5000), // Limit length
        content: fullContent.substring(0, 10000), // Store maximum RSS content
        url: item.link,
        imageUrl: extractImageUrl(item),
        source: sourceName,
        author: item.creator || (item as any).author,
        category: category as any,
        relevanceScore: score,
        industries: JSON.stringify(industries),
        publishedAt,
      };

      articles.push(article);
    }

    return articles;
  } catch (error) {
    console.error(`Error fetching feed ${feedUrl}:`, error);
    return [];
  }
}

/**
 * Fetch articles from ArXiv API for AI research papers
 */
async function fetchArxivArticles(): Promise<InsertArticle[]> {
  try {
    const categories = ['cs.AI', 'cs.LG', 'cs.CL']; // AI, ML, Computational Linguistics
    const articles: InsertArticle[] = [];

    for (const category of categories) {
      // Get papers from last 7 days
      const response = await fetch(
        `http://export.arxiv.org/api/query?search_query=cat:${category}&sortBy=submittedDate&sortOrder=descending&max_results=20`
      );

      const xml = await response.text();

      // Parse XML (simple regex-based parsing for ArXiv)
      const entryRegex = /<entry>[\s\S]*?<\/entry>/g;
      const entries = xml.match(entryRegex) || [];

      for (const entry of entries) {
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const summaryRegex = /<summary>([\s\S]*?)<\/summary>/;
        const summaryMatch = entry.match(summaryRegex);
        const linkMatch = entry.match(/<id>(.*?)<\/id>/);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
        const authorMatches = entry.match(/<name>(.*?)<\/name>/g);

        if (!titleMatch || !linkMatch) continue;

        const title = titleMatch[1].replace(/\s+/g, ' ').trim();
        const summary = summaryMatch
          ? summaryMatch[1].replace(/\s+/g, ' ').trim()
          : '';
        const url = linkMatch[1];
        const publishedAt = publishedMatch
          ? new Date(publishedMatch[1])
          : new Date();
        const authors = authorMatches
          ? authorMatches.map((m) => m.replace(/<\/?name>/g, '')).join(', ')
          : undefined;

        // ArXiv papers are always research category with high relevance
        const article: InsertArticle = {
          sourceId: url,
          title,
          description: summary.substring(0, 5000),
          content: summary.substring(0, 10000),
          url,
          imageUrl: undefined,
          source: 'ArXiv',
          author: authors,
          category: 'research',
          relevanceScore: 75, // Research papers get high default score
          publishedAt,
        };

        articles.push(article);
      }
    }

    return articles;
  } catch (error) {
    console.error('Error fetching ArXiv articles:', error);
    return [];
  }
}

/**
 * Main aggregation function - fetches from all sources
 */
export async function aggregateNews(): Promise<{
  total: number;
  new: number;
  errors: number;
}> {
  console.log('Starting news aggregation...');
  let totalFetched = 0;
  let newArticles = 0;
  let errors = 0;

  // Fetch from RSS feeds
  for (const feed of RSS_FEEDS) {
    try {
      const articles = await fetchFeed(feed.url, feed.source);
      totalFetched += articles.length;

      for (const article of articles) {
        try {
          await insertArticle(article);
          newArticles++;
        } catch (error) {
          // Article might already exist, which is fine
        }
      }
    } catch (error) {
      console.error(`Error processing feed ${feed.source}:`, error);
      errors++;
    }
  }

  // Fetch from ArXiv
  try {
    const arxivArticles = await fetchArxivArticles();
    totalFetched += arxivArticles.length;

    for (const article of arxivArticles) {
      try {
        await insertArticle(article);
        newArticles++;
      } catch (error) {
        // Article might already exist
      }
    }
  } catch (error) {
    console.error('Error processing ArXiv:', error);
    errors++;
  }

  console.log(
    `Aggregation complete: ${totalFetched} fetched, ${newArticles} new, ${errors} errors`
  );

  return { total: totalFetched, new: newArticles, errors };
}

/**
 * Get last aggregation time from database
 */
export async function getLastAggregationTime(): Promise<Date | null> {
  try {
    const { getDb } = await import('./db');
    const { articles } = await import('../drizzle/schema');
    const { desc } = await import('drizzle-orm');

    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select({ createdAt: articles.createdAt })
      .from(articles)
      .orderBy(desc(articles.createdAt))
      .limit(1);

    return result.length > 0 ? result[0].createdAt : null;
  } catch (error) {
    console.error('Error getting last aggregation time:', error);
    return null;
  }
}

