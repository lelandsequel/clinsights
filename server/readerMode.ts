/**
 * Reader mode functionality - on-demand article fetching
 * Similar to browser reader modes
 */

import { extractReadableContent } from './contentExtractor';

export async function getArticleInReaderMode(url: string) {
  try {
    const content = await extractReadableContent(url);
    
    if (!content) {
      return {
        success: false,
        error: 'Could not extract article content',
      };
    }

    return {
      success: true,
      data: content,
    };
  } catch (error) {
    console.error('Reader mode error:', error);
    return {
      success: false,
      error: 'Failed to fetch article',
    };
  }
}

