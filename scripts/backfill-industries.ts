#!/usr/bin/env tsx
/**
 * Backfill industry tags for existing articles
 */

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import { articles } from '../drizzle/schema';
import { invokeLLM } from '../server/_core/llm';

const db = drizzle(process.env.DATABASE_URL!);

async function tagIndustries(title: string, description: string): Promise<string[]> {
  try {
    const prompt = `Analyze this AI news article and identify ALL relevant industries:

Title: ${title}
Description: ${description.substring(0, 500)}

Industries to choose from:
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

Return JSON with industries array. Select ALL that apply.`;

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an AI industry classification expert. Analyze articles and identify all relevant industries.',
        },
        {
          role: 'user',
          content: [{ type: 'text' as const, text: prompt }],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'industry_tags',
          strict: true,
          schema: {
            type: 'object',
            properties: {
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
            required: ['industries'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return ['technology']; // Default fallback
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const result = JSON.parse(contentStr);
    return Array.isArray(result.industries) ? result.industries : ['technology'];
  } catch (error) {
    console.error('Error tagging industries:', error);
    return ['technology']; // Default fallback
  }
}

async function backfillIndustries() {
  console.log('🏭 Starting industry tag backfill...\n');

  // Get all articles
  const allArticles = await db
    .select()
    .from(articles);

  // Filter articles that need industry tags (NULL or empty)
  const articlesToProcess = allArticles.filter(a => !a.industries || a.industries === 'null');

  console.log(`Found ${articlesToProcess.length} articles to process (out of ${allArticles.length} total)\n`);

  let processed = 0;
  let failed = 0;

  for (const article of articlesToProcess) {
    try {
      console.log(`[${processed + 1}/${articlesToProcess.length}] Processing: ${article.title.substring(0, 60)}...`);

      const industries = await tagIndustries(
        article.title,
        article.description || article.content || ''
      );

      await db
        .update(articles)
        .set({ industries: JSON.stringify(industries) })
        .where(eq(articles.id, article.id));

      console.log(`  ✓ Tagged with: ${industries.join(', ')}\n`);
      processed++;

      // Add small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ✗ Failed: ${error}\n`);
      failed++;
    }
  }

  console.log('\n✅ Backfill complete!');
  console.log(`   Processed: ${processed}`);
  console.log(`   Failed: ${failed}`);
}

backfillIndustries()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

