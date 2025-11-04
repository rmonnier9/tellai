'use client';

import { generateArticleAdmin } from '@workspace/lib/server-actions/admin/generate-article-admin';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { toast } from '@workspace/ui/lib/toast';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string | null;
  url: string;
  organization: {
    id: string;
    name: string;
  };
}

interface Article {
  id: string;
  keyword: string;
  title: string | null;
  status: 'pending' | 'generated' | 'published';
  scheduledDate: string;
  jobs: Array<{
    id: string;
    status: string;
  }>;
}

export function AdminArticleGeneration() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [articleIdInput, setArticleIdInput] = useState<string>('');
  const [useInput, setUseInput] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedArticle = articles.find((a) => a.id === selectedArticleId);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchArticles(selectedProductId);
    } else {
      setArticles([]);
      setSelectedArticleId('');
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/products');

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async (productId: string) => {
    try {
      setLoadingArticles(true);
      setError(null);
      const response = await fetch(
        `/api/admin/articles?productId=${productId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again.');
    } finally {
      setLoadingArticles(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    const articleId = useInput ? articleIdInput.trim() : selectedArticleId;

    if (!articleId) {
      toast.error('Please select an article or enter an article ID');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateArticleAdmin({
        articleId,
      });

      if (result.success) {
        toast.success(
          `Article generation started! Article ID: ${result.articleId}, Job ID: ${result.jobId}`
        );
        // Reset form
        setSelectedArticleId('');
        setArticleIdInput('');
        // Refresh articles to show updated status
        if (selectedProductId) {
          await fetchArticles(selectedProductId);
        }
      } else {
        toast.error(result.error || 'Failed to start article generation');
        setError(result.error || 'Failed to start article generation');
      }
    } catch (error) {
      console.error('Error generating article:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to start article generation';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: string, hasJob: boolean) => {
    if (hasJob) {
      return <Badge variant="default">Generating</Badge>;
    }
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'generated':
        return (
          <Badge variant="default" className="bg-green-500">
            Generated
          </Badge>
        );
      case 'published':
        return (
          <Badge variant="default" className="bg-blue-500">
            Published
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Generate Article</CardTitle>
            <CardDescription>
              Start generating an existing article by selecting it or entering
              an article ID
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading products...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">No products found</div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
                required
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {product.organization.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Organization:</span>{' '}
                  {selectedProduct.organization.name}
                </div>
                <div className="text-sm">
                  <span className="font-medium">URL:</span>{' '}
                  <a
                    href={selectedProduct.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {selectedProduct.url}
                  </a>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="article-select">Select Article</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUseInput(!useInput);
                    setSelectedArticleId('');
                    setArticleIdInput('');
                  }}
                >
                  {useInput ? 'Select from list' : 'Enter ID manually'}
                </Button>
              </div>

              {useInput ? (
                <Input
                  id="article-id"
                  placeholder="Enter article ID..."
                  value={articleIdInput}
                  onChange={(e) => setArticleIdInput(e.target.value)}
                />
              ) : (
                <>
                  {loadingArticles ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="text-sm text-muted-foreground">
                        Loading articles...
                      </div>
                    </div>
                  ) : articles.length === 0 ? (
                    <div className="flex items-center justify-center py-4 rounded-md border bg-muted/50">
                      <div className="text-sm text-muted-foreground">
                        No articles found for this product
                      </div>
                    </div>
                  ) : (
                    <Select
                      value={selectedArticleId}
                      onValueChange={setSelectedArticleId}
                      required
                    >
                      <SelectTrigger id="article-select">
                        <SelectValue placeholder="Choose an article..." />
                      </SelectTrigger>
                      <SelectContent>
                        {articles.map((article) => (
                          <SelectItem key={article.id} value={article.id}>
                            <div className="flex items-center justify-between w-full gap-2">
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-medium truncate">
                                  {article.title || article.keyword}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="truncate">
                                    {article.keyword}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {new Date(
                                      article.scheduledDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {getStatusBadge(
                                  article.status,
                                  article.jobs.length > 0
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}
            </div>

            {selectedArticle && !useInput && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Keyword:</span>{' '}
                  {selectedArticle.keyword}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Status:</span>{' '}
                  {getStatusBadge(
                    selectedArticle.status,
                    selectedArticle.jobs.length > 0
                  )}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Scheduled Date:</span>{' '}
                  {new Date(selectedArticle.scheduledDate).toLocaleDateString()}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={
                isGenerating ||
                !(useInput ? articleIdInput.trim() : selectedArticleId)
              }
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Article
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
