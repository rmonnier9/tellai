'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Skeleton } from '@workspace/ui/components/skeleton';
import useActiveProduct from '@workspace/ui/hooks/use-active-product';
import useAllArticles from '@workspace/ui/hooks/use-all-articles';
import { ExternalLink, Eye } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

type Article = {
  id: string;
  keyword: string;
  title: string | null;
  type: 'guide' | 'listicle';
  guideSubtype: string | null;
  listicleSubtype: string | null;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  scheduledDate: Date;
  status: string;
  createdAt: Date;
  publications?: Array<{
    id: string;
    url: string | null;
    credential: {
      id: string;
      type: string;
      name: string | null;
    };
  }>;
};

export function ContentHistoryTable() {
  const { data: product, isLoading: productLoading } = useActiveProduct();
  const { data: articlesData, isLoading: articlesLoading } = useAllArticles({
    productId: product?.id,
  });

  const articles = useMemo(() => {
    if (!articlesData) return [];
    return articlesData.map((article) => ({
      ...article,
      scheduledDate: new Date(article.scheduledDate),
      createdAt: new Date(article.createdAt),
    }));
  }, [articlesData]);

  const filteredArticles = useMemo(() => {
    // Filter for posted/published articles only
    return articles.filter(
      (article) =>
        article.status === 'published' ||
        (article.publications && article.publications.length > 0)
    );
  }, [articles]);

  const getStatusBadge = (article: Article) => {
    const hasPublications =
      article.publications && article.publications.length > 0;

    if (hasPublications) {
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300"
        >
          Published
        </Badge>
      );
    }

    switch (article.status) {
      case 'pending':
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
          >
            Pending
          </Badge>
        );
      case 'generated':
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300"
          >
            Generated
          </Badge>
        );
      case 'published':
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300"
          >
            Published
          </Badge>
        );
      default:
        return <Badge variant="outline">{article.status}</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty: number | null) => {
    if (difficulty === null) return '-';

    let variant: 'default' | 'secondary' | 'destructive' | 'outline' =
      'outline';
    let className = '';

    if (difficulty < 30) {
      variant = 'default';
      className =
        'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300';
    } else if (difficulty < 60) {
      variant = 'secondary';
      className =
        'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300';
    } else {
      variant = 'destructive';
      className =
        'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300';
    }

    return (
      <Badge variant={variant} className={className}>
        {difficulty}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (productLoading || articlesLoading) {
    return <LoadingSkeleton />;
  }

  if (!product) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No product selected. Please select a product to view articles.
        </p>
      </div>
    );
  }

  return (
    <ArticleTable
      articles={filteredArticles as Article[]}
      getStatusBadge={getStatusBadge}
      getDifficultyBadge={getDifficultyBadge}
      formatDate={formatDate}
    />
  );
}

function ArticleTable({
  articles,
  getStatusBadge,
  getDifficultyBadge,
  formatDate,
}: {
  articles: Article[];
  getStatusBadge: (article: Article) => React.ReactNode;
  getDifficultyBadge: (difficulty: number | null) => React.ReactNode;
  formatDate: (date: Date) => string;
}) {
  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground text-lg">No articles found</p>
        <p className="text-muted-foreground text-sm mt-2">
          Articles will appear here once they are created
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="text-left p-4 font-semibold text-sm">Image</th>
              <th className="text-left p-4 font-semibold text-sm">Title</th>
              <th className="text-left p-4 font-semibold text-sm">Keyword</th>
              <th className="text-left p-4 font-semibold text-sm">
                Difficulty
              </th>
              <th className="text-left p-4 font-semibold text-sm">Volume</th>
              <th className="text-left p-4 font-semibold text-sm">Date</th>
              <th className="text-left p-4 font-semibold text-sm">Status</th>
              <th className="text-left p-4 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr
                key={article.id}
                className="border-b hover:bg-muted/30 transition-colors"
              >
                <td className="p-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 flex items-center justify-center text-2xl font-bold text-purple-600 dark:text-purple-300">
                    {(article.title || article.keyword).charAt(0).toUpperCase()}
                  </div>
                </td>
                <td className="p-4">
                  <div className="max-w-md">
                    <p className="font-medium line-clamp-2">
                      {article.title || article.keyword}
                    </p>
                    {article.type && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {article.type}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-sm text-muted-foreground max-w-xs line-clamp-2">
                    {article.keyword}
                  </p>
                </td>
                <td className="p-4">
                  {getDifficultyBadge(article.keywordDifficulty)}
                </td>
                <td className="p-4">
                  <p className="text-sm font-medium">
                    {article.searchVolume !== null
                      ? article.searchVolume.toLocaleString()
                      : '-'}
                  </p>
                </td>
                <td className="p-4">
                  <p className="text-sm text-muted-foreground">
                    {formatDate(article.scheduledDate)}
                  </p>
                </td>
                <td className="p-4">{getStatusBadge(article)}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/articles/${article.id}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                    {(() => {
                      const firstPublication = article.publications?.[0];
                      return firstPublication?.url ? (
                        <a
                          href={firstPublication.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </a>
                      ) : null;
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-lg border p-4">
        <Skeleton className="h-12 w-full mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full mb-2" />
        ))}
      </div>
    </div>
  );
}
