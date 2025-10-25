/**
 * Content extraction utilities for maximum legal content retrieval
 */

import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

/**
 * Validate if a URL is accessible
 */
export async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      maxRedirects: 3,
      validateStatus: (status) => status < 400,
    });
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    console.error(`URL validation failed for ${url}:`, error);
    return false;
  }
}

/**
 * Extract readable content from a URL using Mozilla Readability
 * This is similar to browser reader modes - legal gray area but widely used
 */
export async function extractReadableContent(url: string): Promise<{
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline: string | null;
  length: number;
} | null> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AINewsAggregator/1.0)',
      },
    });

    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return null;
    }

    return {
      title: article.title || '',
      content: article.content || '',
      textContent: article.textContent || '',
      excerpt: article.excerpt || '',
      byline: article.byline || null,
      length: article.length || 0,
    };
  } catch (error) {
    console.error(`Content extraction failed for ${url}:`, error);
    return null;
  }
}

/**
 * Extract maximum content from RSS feed item
 * This is 100% legal - we're using what the publisher provides
 */
export function extractRSSContent(item: any): {
  content: string;
  excerpt: string;
} {
  // Try multiple fields that might contain content
  const contentFields = [
    item['content:encoded'],
    item.content,
    item.description,
    item.summary,
    item.contentSnippet,
  ];

  let fullContent = '';
  for (const field of contentFields) {
    if (field && typeof field === 'string' && field.length > fullContent.length) {
      fullContent = field;
    }
  }

  // Create excerpt (first 500 chars)
  const excerpt = fullContent
    .replace(/<[^>]*>/g, '') // Strip HTML
    .substring(0, 500)
    .trim();

  return {
    content: fullContent,
    excerpt: excerpt || 'No excerpt available',
  };
}

/**
 * Batch validate URLs
 */
export async function batchValidateUrls(urls: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  // Process in batches of 10 to avoid overwhelming servers
  const batchSize = 10;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const promises = batch.map(async (url) => {
      const isValid = await validateUrl(url);
      results.set(url, isValid);
    });
    await Promise.all(promises);
  }

  return results;
}

