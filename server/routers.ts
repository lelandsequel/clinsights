import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  articles: router({
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          category: z.string().optional(),
          industry: z.string().optional(),
          search: z.string().optional(),
          timeRange: z.enum(['24h', '7d', '30d', 'all']).default('24h'),
        })
      )
      .query(async ({ input }) => {
        const { getArticles, getArticleCount } = await import('./db');
        
        // Calculate since date based on time range
        let since: Date | undefined;
        if (input.timeRange !== 'all') {
          const now = new Date();
          const hours = input.timeRange === '24h' ? 24 : input.timeRange === '7d' ? 168 : 720;
          since = new Date(now.getTime() - hours * 60 * 60 * 1000);
        }

        const [articles, total] = await Promise.all([
          getArticles({
            limit: input.limit,
            offset: input.offset,
            category: input.category,
            industry: input.industry,
            search: input.search,
            since,
          }),
          getArticleCount({
            category: input.category,
            industry: input.industry,
            search: input.search,
            since,
          }),
        ]);

        return { articles, total };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getArticleById } = await import('./db');
        return getArticleById(input.id);
      }),

    aggregate: protectedProcedure.mutation(async ({ ctx }) => {
      // Only admins can trigger aggregation
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can trigger news aggregation' });
      }

      const { aggregateNews } = await import('./newsAggregator');
      const result = await aggregateNews();
      return result;
    }),

    lastAggregation: publicProcedure.query(async () => {
      // Return null for now - can be enhanced to track aggregation times
      return null;
    }),

    readerMode: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .query(async ({ input }) => {
        const { getArticleInReaderMode } = await import('./readerMode');
        return getArticleInReaderMode(input.url);
      }),

    generateSummary: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .mutation(async ({ input }) => {
        const { getArticleById } = await import('./db');
        const { invokeLLM } = await import('./_core/llm');
        const { getDb } = await import('./db');
        
        const article = await getArticleById(input.articleId);
        if (!article) {
          throw new Error('Article not found');
        }

        // Check if summary already exists
        if (article.summary) {
          return { summary: article.summary };
        }

        // Generate summary using LLM
        const prompt = `Summarize the following AI news article in 2-3 concise sentences. Focus on the key points and main takeaways.

Title: ${article.title}

Content: ${article.description || article.content || article.title}

Provide only the summary, no additional text.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a helpful assistant that creates concise summaries of AI news articles.' },
            { role: 'user', content: prompt },
          ],
        });

        const messageContent = response.choices[0]?.message?.content;
        const summary = typeof messageContent === 'string' ? messageContent : '';

        // Save summary to database
        const db = await getDb();
        if (db) {
          const { articles } = await import('../drizzle/schema');
          const { eq } = await import('drizzle-orm');
          await db.update(articles)
            .set({ summary })
            .where(eq(articles.id, input.articleId));
        }

        return { summary };
      }),
  }),

  bookmarks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserBookmarks } = await import('./db');
      return getUserBookmarks(ctx.user.id);
    }),

    add: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { addBookmark } = await import('./db');
        await addBookmark(ctx.user.id, input.articleId);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { removeBookmark } = await import('./db');
        await removeBookmark(ctx.user.id, input.articleId);
        return { success: true };
      }),

    isBookmarked: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { isArticleBookmarked } = await import('./db');
        return isArticleBookmarked(ctx.user.id, input.articleId);
      }),
  }),

  readingList: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getReadingList } = await import('./db');
      return getReadingList(ctx.user.id);
    }),

    add: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { addToReadingList } = await import('./db');
        await addToReadingList(ctx.user.id, input.articleId);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { removeFromReadingList } = await import('./db');
        await removeFromReadingList(ctx.user.id, input.articleId);
        return { success: true };
      }),

    isInList: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { isInReadingList } = await import('./db');
        return isInReadingList(ctx.user.id, input.articleId);
      }),
  }),

  readHistory: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getReadHistory } = await import('./db');
      return getReadHistory(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { markAsRead } = await import('./db');
        await markAsRead(ctx.user.id, input.articleId);
        return { success: true };
      }),

    isRead: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { isRead } = await import('./db');
        return isRead(ctx.user.id, input.articleId);
      }),
  }),

  rss: router({
    feed: publicProcedure
      .input(z.object({ 
        category: z.string().optional(),
        limit: z.number().optional().default(50),
      }))
      .query(async ({ input }) => {
        const { getArticles } = await import('./db');
        const articles = await getArticles({
          limit: input.limit,
          offset: 0,
          category: input.category,
        });

        // Generate RSS XML
        const now = new Date().toUTCString();
        const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
        
        const items = articles.map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${article.url}</link>
      <guid isPermaLink="false">${article.id}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${article.description || ''}]]></description>
      <category>${article.category}</category>
      <source url="${article.url}">${article.source}</source>
    </item>`).join('');

        const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI News Aggregator${input.category ? ` - ${input.category}` : ''}</title>
    <link>${baseUrl}</link>
    <description>Daily AI news from top sources</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

        return { rss };
      }),
  }),
});

export type AppRouter = typeof appRouter;
