/**
 * Calculate estimated reading time for an article
 * Average reading speed: 200-250 words per minute
 */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 225;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes); // Minimum 1 minute
}

export function formatReadingTime(minutes: number): string {
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}

