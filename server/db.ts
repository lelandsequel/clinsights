import { and, desc, eq, gte, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Article, articles, bookmarks, InsertArticle, InsertBookmark, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Article queries
export async function insertArticle(article: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.insert(articles).values(article);
  } catch (error: any) {
    // Ignore duplicate key errors (article already exists)
    if (error.code === 'ER_DUP_ENTRY') {
      return;
    }
    throw error;
  }
}

export async function getArticles({
  limit = 50,
  offset = 0,
  category,
  industry,
  search,
  since,
}: {
  limit?: number;
  offset?: number;
  category?: string;
  industry?: string;
  search?: string;
  since?: Date;
} = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  
  if (category && category !== 'all') {
    conditions.push(eq(articles.category, category as any));
  }
  
  if (industry && industry !== 'all') {
    conditions.push(like(articles.industries, `%"${industry}"%`));
  }
  
  if (search) {
    conditions.push(
      or(
        like(articles.title, `%${search}%`),
        like(articles.description, `%${search}%`)
      )
    );
  }
  
  if (since) {
    conditions.push(gte(articles.publishedAt, since));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(articles)
    .where(whereClause)
    .orderBy(desc(articles.relevanceScore), desc(articles.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArticleCount({
  category,
  industry,
  search,
  since,
}: {
  category?: string;
  industry?: string;
  search?: string;
  since?: Date;
} = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  
  if (category && category !== 'all') {
    conditions.push(eq(articles.category, category as any));
  }
  
  if (industry && industry !== 'all') {
    conditions.push(like(articles.industries, `%"${industry}"%`));
  }
  
  if (search) {
    conditions.push(
      or(
        like(articles.title, `%${search}%`),
        like(articles.description, `%${search}%`)
      )
    );
  }
  
  if (since) {
    conditions.push(gte(articles.publishedAt, since));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(whereClause);

  return result[0]?.count ?? 0;
}

// Bookmark queries
export async function addBookmark(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(bookmarks).values({ userId, articleId });
}

export async function removeBookmark(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(bookmarks).where(
    and(
      eq(bookmarks.userId, userId),
      eq(bookmarks.articleId, articleId)
    )
  );
}

export async function getUserBookmarks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      article: articles,
      bookmarkedAt: bookmarks.createdAt,
    })
    .from(bookmarks)
    .innerJoin(articles, eq(bookmarks.articleId, articles.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
}

export async function isArticleBookmarked(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.articleId, articleId)
      )
    )
    .limit(1);

  return result.length > 0;
}


/**
 * Reading List Operations
 */
export async function addToReadingList(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { readingList } = await import("../drizzle/schema");
  await db.insert(readingList).values({ userId, articleId });
}

export async function removeFromReadingList(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { readingList } = await import("../drizzle/schema");
  await db.delete(readingList).where(
    and(
      eq(readingList.userId, userId),
      eq(readingList.articleId, articleId)
    )
  );
}

export async function getReadingList(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const { readingList } = await import("../drizzle/schema");
  
  return db
    .select({
      article: articles,
      addedAt: readingList.createdAt,
    })
    .from(readingList)
    .innerJoin(articles, eq(readingList.articleId, articles.id))
    .where(eq(readingList.userId, userId))
    .orderBy(desc(readingList.createdAt));
}

export async function isInReadingList(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) return false;

  const { readingList } = await import("../drizzle/schema");
  const result = await db
    .select()
    .from(readingList)
    .where(
      and(
        eq(readingList.userId, userId),
        eq(readingList.articleId, articleId)
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Read History Operations
 */
export async function markAsRead(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { readHistory } = await import("../drizzle/schema");
  
  // Check if already marked as read
  const existing = await db
    .select()
    .from(readHistory)
    .where(
      and(
        eq(readHistory.userId, userId),
        eq(readHistory.articleId, articleId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(readHistory).values({ userId, articleId });
  }
}

export async function getReadHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const { readHistory } = await import("../drizzle/schema");
  
  return db
    .select({
      article: articles,
      readAt: readHistory.readAt,
    })
    .from(readHistory)
    .innerJoin(articles, eq(readHistory.articleId, articles.id))
    .where(eq(readHistory.userId, userId))
    .orderBy(desc(readHistory.readAt));
}

export async function isRead(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) return false;

  const { readHistory } = await import("../drizzle/schema");
  const result = await db
    .select()
    .from(readHistory)
    .where(
      and(
        eq(readHistory.userId, userId),
        eq(readHistory.articleId, articleId)
      )
    )
    .limit(1);

  return result.length > 0;
}

