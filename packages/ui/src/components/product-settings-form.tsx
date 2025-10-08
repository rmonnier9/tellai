'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { mutate } from 'swr';

import { Button } from '@workspace/ui/components/button';
import { Form } from '@workspace/ui/components/form';
import { Card } from '@workspace/ui/components/card';
import { UpdateProductSchema } from '@workspace/lib/dtos';
import { updateProduct } from '@workspace/lib/server-actions/update-product';
import { ProductBusinessInfoForm } from '@workspace/ui/components/product-business-info-form';
import { ProductTargetAudienceForm } from '@workspace/ui/components/product-target-audience-form';
import { ProductBlogContentForm } from '@workspace/ui/components/product-blog-content-form';
import { ProductArticlePreferencesForm } from '@workspace/ui/components/product-article-preferences-form';

interface ProductSettingsFormProps {
  product: {
    id: string;
    name?: string | null;
    description?: string | null;
    language?: string | null;
    country?: string | null;
    logo?: string | null;
    targetAudiences?: string[];
    sitemapUrl?: string | null;
    blogUrl?: string | null;
    bestArticles?: string[];
    autoPublish?: boolean;
    articleStyle?: string;
    internalLinks?: number;
    globalInstructions?: string | null;
    imageStyle?: string;
    brandColor?: string;
    includeYoutubeVideo?: boolean;
    includeCallToAction?: boolean;
    includeInfographics?: boolean;
    includeEmojis?: boolean;
  };
}

export function ProductSettingsForm({ product }: ProductSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof UpdateProductSchema>>({
    resolver: zodResolver(UpdateProductSchema),
    defaultValues: {
      name: '',
      description: '',
      language: '',
      country: '',
      logo: '',
      targetAudiences: [],
      sitemapUrl: '',
      blogUrl: '',
      bestArticles: [],
      autoPublish: true,
      articleStyle: 'informative',
      internalLinks: 3,
      globalInstructions: '',
      imageStyle: 'brand-text',
      brandColor: '#000000',
      includeYoutubeVideo: true,
      includeCallToAction: true,
      includeInfographics: true,
      includeEmojis: true,
    },
  });

  // Load product data into form when available
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || '',
        description: product.description || '',
        language: product.language || '',
        country: product.country || '',
        logo: product.logo || '',
        targetAudiences: product.targetAudiences || [],
        sitemapUrl: product.sitemapUrl || '',
        blogUrl: product.blogUrl || '',
        bestArticles: product.bestArticles || [],
        autoPublish: product.autoPublish ?? true,
        articleStyle: (product.articleStyle as any) || 'informative',
        internalLinks: product.internalLinks ?? 3,
        globalInstructions: product.globalInstructions || '',
        imageStyle: (product.imageStyle as any) || 'brand-text',
        brandColor: product.brandColor || '#000000',
        includeYoutubeVideo: product.includeYoutubeVideo ?? true,
        includeCallToAction: product.includeCallToAction ?? true,
        includeInfographics: product.includeInfographics ?? true,
        includeEmojis: product.includeEmojis ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const onSubmit = async (data: z.infer<typeof UpdateProductSchema>) => {
    if (!product?.id) {
      toast.error('No active product found');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateProduct(product.id, data);

      if (result.success) {
        toast.success('Settings saved successfully', {
          description: 'Your product settings have been updated.',
        });
        // Revalidate the product data
        mutate(`/api/products/${product.id}`);
      } else {
        toast.error('Failed to save settings', {
          description: result.error || 'Please try again later.',
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('An error occurred', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Product Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your product configuration and article preferences
        </p>
      </div>

      <Form {...form}>
        <form
          key={product.id}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Business Information */}
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Business Information</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Basic information about your business
                </p>
              </div>
              <ProductBusinessInfoForm form={form} />
            </div>
          </Card>

          {/* Target Audiences */}
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Target Audiences</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Define who your content is for
                </p>
              </div>
              <ProductTargetAudienceForm form={form} />
            </div>
          </Card>

          {/* Blog Content */}
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Blog Content</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure your blog settings and examples
                </p>
              </div>
              <ProductBlogContentForm form={form} />
            </div>
          </Card>

          {/* Article Preferences */}
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Article Preferences</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Set your default article configuration
                </p>
              </div>
              <ProductArticlePreferencesForm form={form} />
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
