import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeftIcon,
  BookmarkIcon, 
  CalendarIcon,
  CheckIcon,
  ExternalLinkIcon,
  ShareIcon,
  SparklesIcon,
  TrendingUpIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { calculateReadingTime, formatReadingTime } from "@/lib/readingTime";

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
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ArticleDetail() {
  const params = useParams();
  const articleId = parseInt(params.id || '0');
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: article, isLoading, refetch } = trpc.articles.getById.useQuery({ id: articleId });
  
  const generateSummary = trpc.articles.generateSummary.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  
  const { data: relatedArticles } = trpc.articles.list.useQuery({
    limit: 3,
    offset: 0,
    category: article?.category,
    timeRange: '7d',
  }, {
    enabled: !!article,
  });

  const { data: isBookmarked } = trpc.bookmarks.isBookmarked.useQuery(
    { articleId },
    { enabled: isAuthenticated && !!article }
  );

  const utils = trpc.useUtils();
  const addBookmark = trpc.bookmarks.add.useMutation({
    onSuccess: () => {
      utils.bookmarks.isBookmarked.invalidate({ articleId });
      utils.bookmarks.list.invalidate();
      toast.success('Article bookmarked!');
    },
  });

  const removeBookmark = trpc.bookmarks.remove.useMutation({
    onSuccess: () => {
      utils.bookmarks.isBookmarked.invalidate({ articleId });
      utils.bookmarks.list.invalidate();
      toast.success('Bookmark removed');
    },
  });

  const handleBookmarkToggle = () => {
    if (isBookmarked) {
      removeBookmark.mutate({ articleId });
    } else {
      addBookmark.mutate({ articleId });
    }
  };

  const handleShare = (platform: 'twitter' | 'linkedin' | 'copy') => {
    const url = window.location.href;
    const text = article?.title || '';

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Feed
              </Button>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-32 w-full" />
        </main>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Article Not Found</CardTitle>
            <CardDescription>
              The article you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Feed
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredRelated = relatedArticles?.articles.filter(a => a.id !== articleId).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Feed
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBookmarkToggle}
                  disabled={addBookmark.isPending || removeBookmark.isPending}
                >
                  <BookmarkIcon 
                    className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-primary text-primary' : ''}`} 
                  />
                  {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('copy')}
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Article Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className={getCategoryColor(article.category)}>
              {article.category.replace('_', ' ')}
            </Badge>
            {article.relevanceScore >= 70 && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                <TrendingUpIcon className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Score: {article.relevanceScore}/100
            </Badge>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {formatDate(article.publishedAt)}
            </div>
            {article.author && (
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                {article.author}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold">{article.source}</span>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-96 object-cover rounded-lg mb-8 border border-border/40"
          />
        )}

        {/* AI Summary */}
        {article.summary && (
          <Card className="border-border/40 mb-8 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-primary" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {article.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Article Content */}
        <Card className="border-border/40 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Article Description</CardTitle>
              {!article.summary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateSummary.mutate({ articleId })}
                  disabled={generateSummary.isPending}
                >
                  {generateSummary.isPending ? (
                    <>
                      <SparklesIcon className="w-4 h-4 mr-2 animate-pulse" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      Generate AI Summary
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {article.description}
            </p>
          </CardContent>
        </Card>

        {article.content && article.content !== article.description && (
          <Card className="border-border/40 mb-8">
            <CardHeader>
              <CardTitle>Full Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {article.content}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Read Original Article */}
        <Card className="border-border/40 mb-8 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Read the full article</h3>
                <p className="text-sm text-muted-foreground">
                  Visit {article.source} for the complete story
                </p>
              </div>
              <Button asChild>
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  Read on {article.source}
                  <ExternalLinkIcon className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share Section */}
        <Card className="border-border/40 mb-8">
          <CardHeader>
            <CardTitle>Share this article</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleShare('twitter')}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('linkedin')}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare('copy')}
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Related Articles */}
        {filteredRelated.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredRelated.map((related) => (
                <Link key={related.id} href={`/article/${related.id}`}>
                  <Card className="border-border/40 hover:border-primary/50 transition-colors h-full cursor-pointer">
                    <CardHeader>
                      <Badge variant="outline" className={getCategoryColor(related.category)}>
                        {related.category.replace('_', ' ')}
                      </Badge>
                      <CardTitle className="text-base line-clamp-2 mt-2">
                        {related.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {related.source} • {formatDate(related.publishedAt).split(',')[0]}
                      </CardDescription>
                    </CardHeader>
                    {related.imageUrl && (
                      <CardContent>
                        <img
                          src={related.imageUrl}
                          alt={related.title}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

