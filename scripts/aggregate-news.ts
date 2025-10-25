/**
 * Manual script to trigger news aggregation
 * Run with: tsx scripts/aggregate-news.ts
 */

import { aggregateNews } from '../server/newsAggregator';

async function main() {
  console.log('Starting news aggregation...');
  
  try {
    const result = await aggregateNews();
    console.log('\n✅ Aggregation complete!');
    console.log(`   Total fetched: ${result.total}`);
    console.log(`   New articles: ${result.new}`);
    console.log(`   Errors: ${result.errors}`);
  } catch (error) {
    console.error('❌ Aggregation failed:', error);
    process.exit(1);
  }
}

main();

