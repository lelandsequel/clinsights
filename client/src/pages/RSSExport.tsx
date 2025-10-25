import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  RssIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const CATEGORIES = [
  { value: '', label: 'All News' },
  { value: 'breakthrough', label: 'Breakthroughs' },
  { value: 'company_announcement', label: 'Companies' },
  { value: 'research', label: 'Research' },
  { value: 'funding', label: 'Funding' },
  { value: 'policy', label: 'Policy' },
  { value: 'other', label: 'Other' },
];

export default function RSSExport() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;
  const rssUrl = selectedCategory
    ? `${baseUrl}/api/trpc/rss.feed?input=${encodeURIComponent(JSON.stringify({ category: selectedCategory }))}`
    : `${baseUrl}/api/trpc/rss.feed`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rssUrl);
    setCopied(true);
    toast.success('RSS feed URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

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
              <RssIcon className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">RSS Feed Export</h1>
                <p className="text-sm text-primary font-medium">AI Insights Hub by C&L Strategy</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-border/40 mb-8">
          <CardHeader>
            <CardTitle>What is RSS?</CardTitle>
            <CardDescription>
              RSS (Really Simple Syndication) allows you to subscribe to our AI news feed in your favorite RSS reader.
              Get automatic updates whenever new articles are published!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Popular RSS Readers:</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Feedly - Web-based RSS reader</li>
                  <li>Inoreader - Advanced RSS reader with filters</li>
                  <li>NewsBlur - Social news reader</li>
                  <li>NetNewsWire - macOS and iOS RSS reader</li>
                  <li>Thunderbird - Desktop email client with RSS support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 mb-8">
          <CardHeader>
            <CardTitle>Select Category</CardTitle>
            <CardDescription>
              Choose a specific category or get all news in one feed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ value, label }) => (
                <Badge
                  key={value}
                  variant={selectedCategory === value ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2 text-sm"
                  onClick={() => setSelectedCategory(value)}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle>Your RSS Feed URL</CardTitle>
            <CardDescription>
              Copy this URL and paste it into your RSS reader
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={rssUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <CheckIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button asChild variant="default">
                  <a href={rssUrl} target="_blank" rel="noopener noreferrer">
                    <RssIcon className="w-4 h-4 mr-2" />
                    Open RSS Feed
                  </a>
                </Button>
                <Button variant="outline" onClick={copyToClipboard}>
                  <CopyIcon className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">How to use:</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Copy the RSS feed URL above</li>
                  <li>Open your RSS reader application</li>
                  <li>Add a new feed/subscription</li>
                  <li>Paste the URL when prompted</li>
                  <li>Enjoy automatic AI news updates!</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

