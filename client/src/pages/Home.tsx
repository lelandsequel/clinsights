import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  ArrowUpIcon,
  BarChart3Icon,
  BookmarkIcon, 
  BookOpenIcon,
  CalendarIcon, 
  ExternalLinkIcon,
  MoonIcon,
  RefreshCwIcon,
  RssIcon,
  SearchIcon, 
  SparklesIcon,
  SunIcon,
  TrendingUpIcon,
  UserIcon
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { calculateReadingTime, formatReadingTime } from "@/lib/readingTime";

const CATEGORIES = [
  { value: 'all', label: 'All News' },
  { value: 'breakthrough', label: 'Breakthroughs' },
  { value: 'company_announcement', label: 'Companies' },
  { value: 'research', label: 'Research' },
  { value: 'funding', label: 'Funding' },
  { value: 'policy', label: 'Policy' },
  { value: 'other', label: 'Other' },
];

const INDUSTRIES = [
  { value: 'all', label: 'All Industries' },
  { value: 'oil_gas', label: 'Oil & Gas' },
  { value: 'medical', label: 'Medical' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance' },
  { value: 'technology', label: 'Technology' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
];

const TIME_RANGES = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
];

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

function formatDate(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [category, setCategory] = useState('all');
  const [industry, setIndustry] = useState('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const ARTICLES_PER_PAGE = 12;

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { data: articlesData, isLoading, isFetching } = trpc.articles.list.useQuery({
    limit: ARTICLES_PER_PAGE,
    offset: page * ARTICLES_PER_PAGE,
    category: category === 'all' ? undefined : category,
    industry: industry === 'all' ? undefined : industry,
    timeRange,
    search: search || undefined,
  });

  // Reset and load first page when filters change
  useEffect(() => {
    setPage(0);
    setAllArticles([]);
  }, [category, industry, timeRange, search]);

  // Append new articles when data arrives
  useEffect(() => {
    if (articlesData?.articles) {
      if (page === 0) {
        setAllArticles(articlesData.articles);
      } else {
        setAllArticles(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const newArticles = articlesData.articles.filter(a => !existingIds.has(a.id));
          return [...prev, ...newArticles];
        });
      }
    }
  }, [articlesData, page]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching && articlesData?.articles.length === ARTICLES_PER_PAGE) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isFetching, articlesData]);

  const { data: lastAggregation } = trpc.articles.lastAggregation.useQuery();
  const utils = trpc.useUtils();
  const aggregateMutation = trpc.articles.aggregate.useMutation({
    onSuccess: () => {
      utils.articles.list.invalidate();
      utils.articles.lastAggregation.invalidate();
    },
  });

  const articles = allArticles;
  const total = articlesData?.total || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI Insights Hub</h1>
                <p className="text-sm text-primary font-medium">by C&L Strategy</p>
                <p className="text-xs text-muted-foreground mt-0.5">Strategic Intelligence, Delivered Daily</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {lastAggregation && (
                <div className="text-sm text-muted-foreground hidden md:block">
                  Last update: {formatDate(lastAggregation)}
                </div>
              )}
              
              {isAuthenticated && user?.role === 'admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => aggregateMutation.mutate()}
                  disabled={aggregateMutation.isPending}
                >
                  <RefreshCwIcon className={`w-4 h-4 mr-2 ${aggregateMutation.isPending ? 'animate-spin' : ''}`} />
                  Refresh News
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-4 h-4" />
                ) : (
                  <MoonIcon className="w-4 h-4" />
                )}
              </Button>

              <Link href="/analytics">
                <Button variant="ghost" size="sm">
                  <BarChart3Icon className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </Link>

              <Link href="/rss">
                <Button variant="ghost" size="sm">
                  <RssIcon className="w-4 h-4 mr-2" />
                  RSS
                </Button>
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link href="/reading-list">
                    <Button variant="ghost" size="sm">
                      <BookOpenIcon className="w-4 h-4 mr-2" />
                      Reading List
                    </Button>
                  </Link>
                  <Link href="/bookmarks">
                    <Button variant="ghost" size="sm">
                      <BookmarkIcon className="w-4 h-4 mr-2" />
                      Bookmarks
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-sm">{user?.name}</span>
                  </div>
                </div>
              ) : (
                <Button asChild>
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{total}</div>
            </CardContent>
          </Card>
          
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Time Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {TIME_RANGES.find(t => t.value === timeRange)?.label}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {new Set(articles.map(a => a.source)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border/40"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
              {CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Industry Filter */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Filter by Industry:</p>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((ind) => (
                <Button
                  key={ind.value}
                  variant={industry === ind.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIndustry(ind.value)}
                  className="text-xs"
                >
                  {ind.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div className="flex gap-2">
            {TIME_RANGES.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range.value as any)}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
           {isLoading && page === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-border/40 overflow-hidden">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles.length === 0 && !isLoading ? (
          <Card className="border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <SparklesIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No articles found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Try adjusting your filters or search terms. If you're an admin, you can refresh the news feed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
              {isFetching && page > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  <span>Loading more articles...</span>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          className="fixed bottom-8 right-8 rounded-full w-12 h-12 shadow-lg z-50"
          size="icon"
          onClick={scrollToTop}
          title="Back to top"
        >
          <ArrowUpIcon className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}

function ArticleCard({ article }: { article: any }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: isBookmarked } = trpc.bookmarks.isBookmarked.useQuery(
    { articleId: article.id },
    { enabled: isAuthenticated }
  );

  const { data: isInReadingList } = trpc.readingList.isInList.useQuery(
    { articleId: article.id },
    { enabled: isAuthenticated }
  );

  const addBookmark = trpc.bookmarks.add.useMutation({
    onSuccess: () => {
      utils.bookmarks.isBookmarked.invalidate({ articleId: article.id });
      utils.bookmarks.list.invalidate();
    },
  });

  const removeBookmark = trpc.bookmarks.remove.useMutation({
    onSuccess: () => {
      utils.bookmarks.isBookmarked.invalidate({ articleId: article.id });
      utils.bookmarks.list.invalidate();
    },
  });

  const addToReadingList = trpc.readingList.add.useMutation({
    onSuccess: () => {
      utils.readingList.isInList.invalidate({ articleId: article.id });
      utils.readingList.list.invalidate();
    },
  });

  const removeFromReadingList = trpc.readingList.remove.useMutation({
    onSuccess: () => {
      utils.readingList.isInList.invalidate({ articleId: article.id });
      utils.readingList.list.invalidate();
    },
  });

  const handleBookmarkToggle = () => {
    if (isBookmarked) {
      removeBookmark.mutate({ articleId: article.id });
    } else {
      addBookmark.mutate({ articleId: article.id });
    }
  };

  const handleReadingListToggle = () => {
    if (isInReadingList) {
      removeFromReadingList.mutate({ articleId: article.id });
    } else {
      addToReadingList.mutate({ articleId: article.id });
    }
  };

  return (
    <Card className="border-border/40 hover:border-primary/50 transition-colors group">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className={getCategoryColor(article.category)}>
            {article.category.replace('_', ' ')}
          </Badge>
          
          <div className="flex items-center gap-2">
            {article.relevanceScore >= 70 && (
              <TrendingUpIcon className="w-4 h-4 text-yellow-500" />
            )}
            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReadingListToggle}
                  className="h-8 w-8 p-0"
                  title={isInReadingList ? 'Remove from reading list' : 'Add to reading list'}
                >
                  <BookOpenIcon 
                    className={`w-4 h-4 ${isInReadingList ? 'fill-primary text-primary' : ''}`} 
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmarkToggle}
                  className="h-8 w-8 p-0"
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                  <BookmarkIcon 
                    className={`w-4 h-4 ${isBookmarked ? 'fill-primary text-primary' : ''}`} 
                  />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <Link href={`/article/${article.id}`}>
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors cursor-pointer">
            {article.title}
          </CardTitle>
        </Link>
        
        <CardDescription className="flex items-center gap-2 text-xs">
          <span>{article.source}</span>
          <span>•</span>
          <span>{formatDate(article.publishedAt)}</span>
          <span>•</span>
          <span>{formatReadingTime(calculateReadingTime(article.description || article.content || article.title))}</span>
          {article.author && (
            <>
              <span>•</span>
              <span className="line-clamp-1">{article.author}</span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-40 object-cover rounded-md mb-4"
          />
        )}
        
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {article.description}
        </p>
        
        <Button variant="outline" size="sm" asChild className="w-full">
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            Read Full Article
            <ExternalLinkIcon className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

