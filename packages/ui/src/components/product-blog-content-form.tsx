'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { UseFormReturn } from 'react-hook-form';

interface ProductBlogContentFormProps {
  form: UseFormReturn<any>;
}

export function ProductBlogContentForm({ form }: ProductBlogContentFormProps) {
  const bestArticles = form.watch('bestArticles') || ['', '', ''];

  const updateBestArticle = (index: number, value: string) => {
    const updatedArticles = [...bestArticles];
    updatedArticles[index] = value;
    form.setValue('bestArticles', updatedArticles);
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
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <Input
                  key={index}
                  placeholder={`Your top article URL #${index + 1}`}
                  value={bestArticles[index] || ''}
                  onChange={(e) => updateBestArticle(index, e.target.value)}
                  type="url"
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
