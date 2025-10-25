import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeftIcon,
  BarChart3Icon,
  CalendarIcon,
  NewspaperIcon,
  PieChartIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    breakthrough: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    company_announcement: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    research: 'bg-green-500/10 text-green-400 border-green-500/20',
    funding: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    policy: 'bg-red-500/10 text-red-400 border-red-500/20',
    other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  return colors[category] || colors.other;
}

export default function Analytics() {
  const { isAuthenticated } = useAuth();

  const { data: articlesData, isLoading } = trpc.articles.list.useQuery({
    limit: 1000,
    offset: 0,
  });

  const analytics = useMemo(() => {
    if (!articlesData?.articles) return null;

    const articles = articlesData.articles;

    // Category distribution
    const categoryCount: Record<string, number> = {};
    articles.forEach(article => {
      categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
    });

    // Source distribution
    const sourceCount: Record<string, number> = {};
    articles.forEach(article => {
      sourceCount[article.source] = (sourceCount[article.source] || 0) + 1;
    });

    // Trending topics (extract keywords from titles)
    const wordCount: Record<string, number> = {};
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'new', 'just', 'now', 'how', 'what', 'when', 'where', 'who', 'why', 'which']);
    
    articles.forEach(article => {
      const words = article.title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));
      
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    // Get top trending words
    const trendingWords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    // Average relevance score by category
    const categoryScores: Record<string, { total: number; count: number }> = {};
    articles.forEach(article => {
      if (!categoryScores[article.category]) {
        categoryScores[article.category] = { total: 0, count: 0 };
      }
      categoryScores[article.category].total += article.relevanceScore;
      categoryScores[article.category].count += 1;
    });

    const avgScoresByCategory = Object.entries(categoryScores).map(([category, { total, count }]) => ({
      category,
      avgScore: Math.round(total / count),
    })).sort((a, b) => b.avgScore - a.avgScore);

    // Time distribution (last 7 days)
    const now = new Date();
    const dayCount: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dayCount[key] = 0;
    }

    articles.forEach(article => {
      const date = new Date(article.publishedAt).toISOString().split('T')[0];
      if (dayCount.hasOwnProperty(date)) {
        dayCount[date] += 1;
      }
    });

    return {
      categoryCount,
      sourceCount,
      trendingWords,
      avgScoresByCategory,
      dayCount,
      totalArticles: articles.length,
      avgRelevanceScore: Math.round(articles.reduce((sum, a) => sum + a.relevanceScore, 0) / articles.length),
    };
  }, [articlesData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <BarChart3Icon className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
                <p className="text-sm text-primary font-medium">AI Insights Hub by C&L Strategy</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-border/40">
                <CardHeader>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !analytics ? (
          <Card className="border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <PieChartIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No data available</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Analytics will appear once articles are aggregated.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <NewspaperIcon className="w-4 h-4" />
                    Total Articles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{analytics.totalArticles}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUpIcon className="w-4 h-4" />
                    Avg Relevance Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{analytics.avgRelevanceScore}/100</div>
                  <p className="text-xs text-muted-foreground mt-1">Overall quality metric</p>
                </CardContent>
              </Card>

              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Active Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{Object.keys(analytics.sourceCount).length}</div>
                  <p className="text-xs text-muted-foreground mt-1">News providers</p>
                </CardContent>
              </Card>
            </div>

            {/* Trending Topics */}
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUpIcon className="w-5 h-5" />
                  Trending Topics
                </CardTitle>
                <CardDescription>Most mentioned keywords in article titles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analytics.trendingWords.map(({ word, count }) => (
                    <Badge
                      key={word}
                      variant="outline"
                      className="text-sm px-3 py-1.5 bg-primary/5 border-primary/20"
                      style={{
                        fontSize: `${Math.min(1.2, 0.8 + count / 10)}rem`,
                      }}
                    >
                      {word} <span className="ml-1.5 text-xs text-muted-foreground">({count})</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <Card className="border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    Category Distribution
                  </CardTitle>
                  <CardDescription>Articles by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.categoryCount)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, count]) => {
                        const percentage = Math.round((count / analytics.totalArticles) * 100);
                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <Badge variant="outline" className={getCategoryColor(category)}>
                                {category.replace('_', ' ')}
                              </Badge>
                              <span className="text-muted-foreground">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Source Distribution */}
              <Card className="border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <NewspaperIcon className="w-5 h-5" />
                    Top Sources
                  </CardTitle>
                  <CardDescription>Most active news providers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.sourceCount)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([source, count]) => {
                        const percentage = Math.round((count / analytics.totalArticles) * 100);
                        return (
                          <div key={source} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-foreground">{source}</span>
                              <span className="text-muted-foreground">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Average Scores by Category */}
              <Card className="border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3Icon className="w-5 h-5" />
                    Quality by Category
                  </CardTitle>
                  <CardDescription>Average relevance scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.avgScoresByCategory.map(({ category, avgScore }) => (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="outline" className={getCategoryColor(category)}>
                            {category.replace('_', ' ')}
                          </Badge>
                          <span className="text-muted-foreground">
                            {avgScore}/100
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full transition-all"
                            style={{ width: `${avgScore}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card className="border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    7-Day Activity
                  </CardTitle>
                  <CardDescription>Articles published per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.dayCount).map(([date, count]) => {
                      const maxCount = Math.max(...Object.values(analytics.dayCount));
                      const percentage = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                      const dateObj = new Date(date);
                      const dayLabel = dateObj.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      });
                      
                      return (
                        <div key={date} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{dayLabel}</span>
                            <span className="text-muted-foreground">{count} articles</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

