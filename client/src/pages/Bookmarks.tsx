import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeftIcon,
  BookmarkIcon, 
  ExternalLinkIcon, 
  SparklesIcon,
  TrashIcon
} from "lucide-react";
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

export default function Bookmarks() {
  const { isAuthenticated } = useAuth();

  const { data: bookmarks, isLoading } = trpc.bookmarks.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  const removeBookmark = trpc.bookmarks.remove.useMutation({
    onSuccess: () => {
      utils.bookmarks.list.invalidate();
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to be signed in to view your bookmarks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <BookmarkIcon className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Bookmarks</h1>
                <p className="text-sm text-muted-foreground">Saved articles for later reading</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-border/40">
                <CardHeader>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !bookmarks || bookmarks.length === 0 ? (
          <Card className="border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookmarkIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Start bookmarking articles from the home page to save them for later.
              </p>
              <Link href="/">
                <Button>
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Browse Articles
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map(({ article, bookmarkedAt }) => (
              <Card key={article.id} className="border-border/40 hover:border-primary/50 transition-colors group">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className={getCategoryColor(article.category)}>
                      {article.category.replace('_', ' ')}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBookmark.mutate({ articleId: article.id })}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                  
                  <CardDescription className="flex items-center gap-2 text-xs">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{formatDate(article.publishedAt)}</span>
                    {article.author && (
                      <>
                        <span>•</span>
                        <span className="line-clamp-1">{article.author}</span>
                      </>
                    )}
                  </CardDescription>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    Bookmarked {formatDate(bookmarkedAt)}
                  </div>
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

