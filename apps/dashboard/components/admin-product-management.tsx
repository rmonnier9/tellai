'use client';

import { resetAndRegenerateKeywords } from '@workspace/lib/server-actions/reset-and-regenerate-keywords';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { toast } from '@workspace/ui/lib/toast';
import { AlertCircle, Loader2, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string | null;
  url: string;
  organization: {
    id: string;
    name: string;
  };
  _count: {
    articles: number;
  };
}

export function AdminProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const handleResetKeywords = async () => {
    if (!selectedProductId) {
      toast.error('Please select a product first');
      return;
    }

    // Confirm before resetting
    const confirmed = window.confirm(
      `Are you sure you want to delete all pending articles for "${selectedProduct?.name}" and regenerate keywords? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsResetting(true);
    try {
      const result = await resetAndRegenerateKeywords(selectedProductId);

      if (result.success) {
        toast.success(
          `Successfully deleted ${result.deletedCount} pending article${result.deletedCount! > 1 ? 's' : ''} and triggered keyword regeneration (Job ID: ${result.jobId})`
        );
        // Refresh products list to update pending count
        await fetchProducts();
      } else {
        toast.error(result.error || 'Failed to reset and regenerate keywords');
      }
    } catch (error) {
      console.error('Error resetting keywords:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to reset keywords'
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Product Management</CardTitle>
            <CardDescription>
              Reset and regenerate keywords for any product
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
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Product</label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">
                          ({product._count.articles} pending)
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
                <div className="text-sm">
                  <span className="font-medium">Pending Articles:</span>{' '}
                  {selectedProduct._count.articles}
                </div>
              </div>
            )}

            <Button
              variant="destructive"
              onClick={handleResetKeywords}
              disabled={isResetting || !selectedProductId}
              className="w-full"
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting & Regenerating...
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Reset & Regenerate Keywords
                </>
              )}
            </Button>

            {!loading && products.length > 0 && (
              <div className="text-sm text-muted-foreground text-center">
                Showing {products.length} product
                {products.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
