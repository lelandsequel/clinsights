/**
 * Seed database with sample AI news articles
 * Run with: pnpm tsx scripts/seed-data.ts
 */

import { insertArticle } from '../server/db';

const sampleArticles = [
  {
    sourceId: 'sample-1',
    title: 'OpenAI Announces GPT-5 with Revolutionary Reasoning Capabilities',
    description: 'OpenAI has unveiled GPT-5, featuring breakthrough improvements in logical reasoning, multi-step problem solving, and contextual understanding. The new model demonstrates human-level performance on complex mathematical and scientific tasks.',
    content: 'Full article content here...',
    url: 'https://openai.com/blog/gpt-5-announcement',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    source: 'OpenAI',
    author: 'Sam Altman',
    category: 'breakthrough' as const,
    relevanceScore: 95,
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    sourceId: 'sample-2',
    title: 'Google DeepMind Achieves Breakthrough in Protein Folding with AlphaFold 3',
    description: 'DeepMind researchers have developed AlphaFold 3, which can now predict protein-ligand interactions with unprecedented accuracy, potentially accelerating drug discovery by years.',
    content: 'Full article content here...',
    url: 'https://deepmind.google/research/alphafold-3',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
    source: 'Google DeepMind',
    author: 'Demis Hassabis',
    category: 'research' as const,
    relevanceScore: 92,
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    sourceId: 'sample-3',
    title: 'Anthropic Raises $2B Series D Led by Google and Salesforce',
    description: 'AI safety company Anthropic has closed a $2 billion Series D funding round, bringing its valuation to $18 billion. The funds will be used to scale Claude AI and advance AI safety research.',
    content: 'Full article content here...',
    url: 'https://www.anthropic.com/news/series-d-funding',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800',
    source: 'TechCrunch',
    author: 'Sarah Perez',
    category: 'funding' as const,
    relevanceScore: 88,
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
  },
  {
    sourceId: 'sample-4',
    title: 'EU Passes Landmark AI Regulation Act with Strict Safety Requirements',
    description: 'The European Union has approved comprehensive AI regulations requiring transparency, safety testing, and human oversight for high-risk AI systems. Companies have 24 months to comply.',
    content: 'Full article content here...',
    url: 'https://ec.europa.eu/ai-act',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    source: 'The Verge',
    author: 'James Vincent',
    category: 'policy' as const,
    relevanceScore: 85,
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
  },
  {
    sourceId: 'sample-5',
    title: 'Microsoft Integrates Advanced AI Copilot Across Office 365 Suite',
    description: 'Microsoft announces deep integration of AI Copilot into Word, Excel, PowerPoint, and Outlook, offering context-aware assistance, automated workflows, and intelligent content generation.',
    content: 'Full article content here...',
    url: 'https://www.microsoft.com/copilot-office',
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    source: 'Microsoft',
    author: 'Satya Nadella',
    category: 'company_announcement' as const,
    relevanceScore: 82,
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
  },
  {
    sourceId: 'sample-6',
    title: 'Stanford Researchers Develop AI Model That Predicts Climate Patterns',
    description: 'A new AI system from Stanford can forecast extreme weather events up to two weeks in advance with 90% accuracy, potentially saving lives and reducing economic damage.',
    content: 'Full article content here...',
    url: 'https://arxiv.org/abs/2024.12345',
    imageUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800',
    source: 'ArXiv',
    author: 'Dr. Emily Chen et al.',
    category: 'research' as const,
    relevanceScore: 87,
    publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
  },
  {
    sourceId: 'sample-7',
    title: 'Meta Releases Open-Source Llama 3 with 405B Parameters',
    description: 'Meta has open-sourced Llama 3, their largest language model yet, featuring 405 billion parameters and matching GPT-4 performance on many benchmarks. The model is available for commercial use.',
    content: 'Full article content here...',
    url: 'https://ai.meta.com/llama',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
    source: 'Meta AI',
    author: 'Mark Zuckerberg',
    category: 'company_announcement' as const,
    relevanceScore: 91,
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },
  {
    sourceId: 'sample-8',
    title: 'AI Startup Perplexity Valued at $3B After Latest Funding Round',
    description: 'AI-powered search engine Perplexity has raised $250M in Series C funding, reaching a $3 billion valuation. The company plans to expand its enterprise offerings and compete directly with Google.',
    content: 'Full article content here...',
    url: 'https://www.perplexity.ai/funding',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    source: 'VentureBeat',
    author: 'Kyle Wiggers',
    category: 'funding' as const,
    relevanceScore: 79,
    publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000), // 15 hours ago
  },
  {
    sourceId: 'sample-9',
    title: 'New Study Shows AI Can Detect Early-Stage Cancer with 95% Accuracy',
    description: 'Researchers have developed an AI system that can identify early-stage cancers from medical imaging with higher accuracy than human radiologists, potentially enabling earlier treatment.',
    content: 'Full article content here...',
    url: 'https://www.nature.com/articles/ai-cancer-detection',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
    source: 'Nature',
    author: 'Dr. Sarah Johnson',
    category: 'breakthrough' as const,
    relevanceScore: 94,
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },
  {
    sourceId: 'sample-10',
    title: 'OpenAI Partners with Apple to Integrate ChatGPT into iOS 18',
    description: 'Apple and OpenAI announce strategic partnership to bring ChatGPT capabilities natively to iPhone, iPad, and Mac devices, with deep Siri integration and privacy-first design.',
    content: 'Full article content here...',
    url: 'https://www.apple.com/newsroom/chatgpt-partnership',
    imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800',
    source: 'Apple',
    author: 'Tim Cook',
    category: 'company_announcement' as const,
    relevanceScore: 90,
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    sourceId: 'sample-11',
    title: 'China Announces National AI Strategy with $50B Investment',
    description: 'Chinese government unveils comprehensive AI development plan with $50 billion in funding over five years, focusing on semiconductors, foundation models, and AI safety.',
    content: 'Full article content here...',
    url: 'https://www.reuters.com/china-ai-strategy',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
    source: 'Reuters',
    author: 'Michael Martina',
    category: 'policy' as const,
    relevanceScore: 83,
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
  },
  {
    sourceId: 'sample-12',
    title: 'MIT Develops AI That Can Learn from Just 10 Examples',
    description: 'MIT CSAIL researchers have created a few-shot learning system that can master new tasks with minimal training data, mimicking human learning capabilities more closely than previous approaches.',
    content: 'Full article content here...',
    url: 'https://news.mit.edu/few-shot-learning',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    source: 'MIT News',
    author: 'Prof. Joshua Tenenbaum',
    category: 'research' as const,
    relevanceScore: 86,
    publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14 hours ago
  },
];

async function main() {
  console.log('Seeding database with sample articles...\n');

  let inserted = 0;
  let skipped = 0;

  for (const article of sampleArticles) {
    try {
      await insertArticle(article);
      inserted++;
      console.log(`✓ Inserted: ${article.title.substring(0, 60)}...`);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        skipped++;
        console.log(`⊘ Skipped (duplicate): ${article.title.substring(0, 60)}...`);
      } else {
        console.error(`✗ Error inserting article:`, error.message);
      }
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${sampleArticles.length}`);
}

main().catch(console.error);

