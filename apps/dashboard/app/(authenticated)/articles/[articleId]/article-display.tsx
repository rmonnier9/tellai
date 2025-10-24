'use client';

import type { Article as ArticleType } from '@workspace/db/prisma/generated/client';
import { publishArticle } from '@workspace/lib/server-actions/publish-article';
import { publishToCredential } from '@workspace/lib/server-actions/publish-to-credential';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { MarkdownContent } from '@workspace/ui/components/markdown-content';
import { Separator } from '@workspace/ui/components/separator';
import { toast } from '@workspace/ui/lib/toast';
import {
  BarChart3,
  Calendar,
  Check,
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Send,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Article = ArticleType & {
  product: {
    id: string;
    name: string | null;
    url: string;
    logo: string | null;
  };
  publications: Array<{
    id: string;
    url: string | null;
    createdAt: Date;
    credential: {
      id: string;
      type: string;
      name: string | null;
    };
  }>;
};

type Credential = {
  id: string;
  type: string;
  name: string | null;
  config: unknown;
  createdAt: Date;
};

export function ArticleDisplay({
  article,
  credentials = [],
}: {
  article: Article;
  credentials?: Credential[];
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingCredentials, setPublishingCredentials] = useState<
    Set<string>
  >(new Set());

  const handleCopy = async () => {
    if (article.content) {
      await navigator.clipboard.writeText(article.content);
      setCopied(true);
      toast.success('Content copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await publishArticle({ articleId: article.id });

      if (result.errors && result.errors.length > 0) {
        toast.warning(
          `Published to ${result.publicationsCount} of ${result.totalCredentials} integrations`,
          {
            description: `Some publications failed: ${result.errors.join(', ')}`,
          }
        );
      } else {
        toast.success(
          `Successfully published to ${result.publicationsCount} integration${result.publicationsCount === 1 ? '' : 's'}!`
        );
      }

      // Refresh the page to show updated publications
      router.refresh();
    } catch (error) {
      toast.error('Failed to publish article', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishToIntegration = async (
    credentialId: string,
    credentialName: string
  ) => {
    setPublishingCredentials((prev) => new Set(prev).add(credentialId));
    try {
      await publishToCredential({
        articleId: article.id,
        credentialId,
      });

      toast.success(`Successfully published to ${credentialName}!`);

      // Refresh the page to show updated publications
      router.refresh();
    } catch (error) {
      toast.error('Failed to publish', {
        description:
          error instanceof Error
            ? error.message
            : `Could not publish to ${credentialName}`,
      });
    } finally {
      setPublishingCredentials((prev) => {
        const next = new Set(prev);
        next.delete(credentialId);
        return next;
      });
    }
  };

  // Get icon for integration type
  const getIntegrationLogo = (type: string) => {
    const logos: Record<string, string> = {
      shopify: '/images/shopify.svg',
      wordpress: '/images/wordpress.svg',
      webflow: '/images/webflow.svg',
      webhook: '/images/webhook.svg',
      notion: '/images/notion.svg',
      framer: '/images/framer.svg',
      wix: '/images/wix.svg',
    };
    return logos[type] || '/images/webhook.svg';
  };

  // Map credentials to show publish status
  const publishedCredentialIds = new Set(
    article.publications.map((pub) => pub.credential.id)
  );

  // Show all credentials, marking which have been published
  const credentialsWithStatus = credentials.map((cred) => ({
    ...cred,
    isPublished: publishedCredentialIds.has(cred.id),
    publication: article.publications.find(
      (pub) => pub.credential.id === cred.id
    ),
  }));

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
            {article.type && (
              <Badge variant="outline" className={getTypeColor(article.type)}>
                {article.type}
              </Badge>
            )}
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

          {/* SEO Metrics - Compact Design */}
          <div className="grid gap-3 md:grid-cols-4">
            {article.searchVolume !== null && (
              <Card className="overflow-hidden py-4 mb-auto">
                <CardContent className="px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Search Volume
                        </p>
                        <p className="text-xl font-bold">
                          {article.searchVolume.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {article.keywordDifficulty !== null && (
              <Card className="overflow-hidden py-4 mb-auto">
                <CardContent className="px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                        <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Difficulty
                        </p>
                        <p className="text-xl font-bold">
                          {article.keywordDifficulty}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {article.cpc !== null && (
              <Card className="overflow-hidden py-4 mb-auto">
                <CardContent className="px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          CPC
                        </p>
                        <p className="text-xl font-bold">${article.cpc}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {article.competition !== null && (
              <Card className="overflow-hidden py-4 mb-auto">
                <CardContent className="px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                        <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Competition
                        </p>
                        <p className="text-xl font-bold">
                          {Math.round(Number(article.competition) * 100)}
                        </p>
                      </div>
                    </div>
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
            {article.status !== 'published' && article.content && (
              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
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

          {/* Integrations */}
          {credentialsWithStatus.length > 0 && article.content && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Integrations</CardTitle>
                <CardDescription>
                  Publish or republish this article to your configured
                  integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {credentialsWithStatus.map((credential) => (
                    <div
                      key={credential.id}
                      className="flex items-center justify-between rounded-lg border bg-background p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-2 shadow-sm">
                          <img
                            src={getIntegrationLogo(credential.type)}
                            alt={`${credential.type} logo`}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {credential.name ||
                              credential.type.charAt(0).toUpperCase() +
                                credential.type.slice(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {credential.isPublished ? (
                              <>
                                Last published{' '}
                                {credential.publication?.createdAt &&
                                  new Date(
                                    credential.publication.createdAt
                                  ).toLocaleDateString()}
                              </>
                            ) : (
                              'Not yet published'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {credential.isPublished &&
                          credential.publication?.url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={credential.publication.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        <Button
                          variant={
                            credential.isPublished ? 'outline' : 'default'
                          }
                          size="sm"
                          onClick={() =>
                            handlePublishToIntegration(
                              credential.id,
                              credential.name || credential.type
                            )
                          }
                          disabled={publishingCredentials.has(credential.id)}
                        >
                          {publishingCredentials.has(credential.id) ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              {credential.isPublished ? 'Republish' : 'Publish'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
