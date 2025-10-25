import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Reading list table - articles saved for "read later"
 */
export const readingList = mysqlTable("readingList", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  articleId: int("articleId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReadingListItem = typeof readingList.$inferSelect;
export type InsertReadingListItem = typeof readingList.$inferInsert;

/**
 * Read history table - tracks which articles users have read
 */
export const readHistory = mysqlTable("readHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  articleId: int("articleId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
});

export type ReadHistoryItem = typeof readHistory.$inferSelect;
export type InsertReadHistoryItem = typeof readHistory.$inferInsert;

/**
 * Articles table for storing aggregated AI news
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique identifier from source (URL or GUID) */
  sourceId: varchar("sourceId", { length: 512 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  /** AI-generated summary (optional) */
  summary: text("summary"),
  url: varchar("url", { length: 1024 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 1024 }),
  source: varchar("source", { length: 128 }).notNull(),
  author: varchar("author", { length: 256 }),
  category: mysqlEnum("category", [
    "breakthrough",
    "company_announcement",
    "policy",
    "funding",
    "research",
    "other"
  ]).default("other").notNull(),
  /** Relevance score 0-100 */
  relevanceScore: int("relevanceScore").default(50).notNull(),
  /** JSON array of relevant industries */
  industries: text("industries"),
  publishedAt: timestamp("publishedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Bookmarks table for users to save favorite articles
 */
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  articleId: int("articleId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;