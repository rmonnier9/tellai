'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { UseFormReturn } from 'react-hook-form';

interface ProductBlogContentFormProps {
  form: UseFormReturn<any>;
}

export function ProductBlogContentForm({ form }: ProductBlogContentFormProps) {
  const [bestArticleInput, setBestArticleInput] = useState('');

  const addBestArticle = () => {
    if (bestArticleInput.trim()) {
      const currentArticles = form.getValues('bestArticles') || [];
      if (currentArticles.length < 3) {
        form.setValue('bestArticles', [
          ...currentArticles,
          bestArticleInput.trim(),
        ]);
        setBestArticleInput('');
      }
    }
  };

  const removeBestArticle = (index: number) => {
    const currentArticles = form.getValues('bestArticles') || [];
    form.setValue(
      'bestArticles',
      currentArticles.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="sitemapUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sitemap URL</FormLabel>
            <FormControl>
              <Input
                placeholder="https://www.sitegpt.ai/sitemap.xml"
                type="url"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="blogUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Main blog address</FormLabel>
            <FormControl>
              <Input
                placeholder="https://yourblog.com/blog"
                type="url"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="bestArticles"
        render={() => (
          <FormItem>
            <FormLabel>Your best article examples URL</FormLabel>
            <FormDescription>
              Add up to 3 URLs of your best articles to help us understand your
              content style
            </FormDescription>
            <div className="flex gap-2">
              <Input
                placeholder="Your top article URL #1"
                value={bestArticleInput}
                onChange={(e) => setBestArticleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBestArticle();
                  }
                }}
                disabled={(form.watch('bestArticles')?.length || 0) >= 3}
              />
              <Button
                type="button"
                onClick={addBestArticle}
                disabled={(form.watch('bestArticles')?.length || 0) >= 3}
              >
                Add
              </Button>
            </div>

            {/* Display best articles */}
            <div className="mt-4 space-y-2">
              {form.watch('bestArticles')?.map((article, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <span className="flex-1 truncate">{article}</span>
                  <button
                    type="button"
                    onClick={() => removeBestArticle(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
