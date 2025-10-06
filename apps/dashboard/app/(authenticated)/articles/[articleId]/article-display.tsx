'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { MarkdownContent } from '@workspace/ui/components/markdown-content';
import {
  Calendar,
  TrendingUp,
  DollarSign,
  Eye,
  Copy,
  Check,
  ExternalLink,
  FileText,
  BarChart3,
} from 'lucide-react';
import { toast } from '@workspace/ui/lib/toast';

type Article = {
  id: string;
  keyword: string;
  title: string | null;
  type: 'guide' | 'listicle';
  guideSubtype: string | null;
  listicleSubtype: string | null;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  cpc: number | null;
  competition: number | null;
  scheduledDate: Date;
  status: string;
  content: string | null;
  publishedUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string | null;
    url: string;
    logo: string | null;
  };
};

export function ArticleDisplay({ article }: { article: Article }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (article.content) {
      await navigator.clipboard.writeText(article.content);
      setCopied(true);
      toast.success('Content copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'generated':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
      case 'published':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      case 'listicle':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (!article.content) {
    return (
      <div className="flex flex-1 flex-col p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Content Available</CardTitle>
            <CardDescription>
              This article hasn't been generated yet. Please generate the
              content first from the calendar page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          {/* Meta badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={getStatusColor(article.status)}>
              {article.status}
            </Badge>
            <Badge variant="outline" className={getTypeColor(article.type)}>
              {article.type}
            </Badge>
            {article.guideSubtype && (
              <Badge variant="outline">{article.guideSubtype}</Badge>
            )}
            {article.listicleSubtype && (
              <Badge variant="outline">{article.listicleSubtype}</Badge>
            )}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              {article.title || article.keyword}
            </h1>
            <p className="text-muted-foreground text-lg">
              Target keyword:{' '}
              <span className="font-medium">{article.keyword}</span>
            </p>
          </div>

          {/* SEO Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            {article.searchVolume !== null && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <CardDescription className="text-xs">
                      Search Volume
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {article.searchVolume.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}

            {article.keywordDifficulty !== null && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <CardDescription className="text-xs">
                      Keyword Difficulty
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {article.keywordDifficulty}%
                  </div>
                </CardContent>
              </Card>
            )}

            {article.cpc !== null && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <CardDescription className="text-xs">CPC</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${article.cpc}</div>
                </CardContent>
              </Card>
            )}

            {article.competition !== null && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <CardDescription className="text-xs">
                      Competition
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(article.competition * 100)}%
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleCopy} variant="outline">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Content
                </>
              )}
            </Button>
            {article.publishedUrl && (
              <Button variant="outline" asChild>
                <a
                  href={article.publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Published
                </a>
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Scheduled:{' '}
                {new Date(article.scheduledDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Article Content */}
        <Card className="border-none shadow-none">
          <CardContent className="p-0">
            <MarkdownContent content={article.content} className="prose-lg" />
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>
                  Created: {new Date(article.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>
                  Last updated: {new Date(article.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
