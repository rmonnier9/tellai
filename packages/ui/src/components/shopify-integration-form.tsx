'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@workspace/ui/components/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Card } from '@workspace/ui/components/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert';

import { ShopifyCredentialSchema } from '@workspace/lib/dtos';
import { createCredential } from '@workspace/lib/server-actions/create-credential';

export function ShopifyIntegrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof ShopifyCredentialSchema>>({
    resolver: zodResolver(ShopifyCredentialSchema),
    defaultValues: {
      name: '',
      storeName: '',
      accessToken: '',
      blogId: '',
      authorName: '',
      publishingStatus: 'draft',
    },
  });

  async function onSubmit(data: z.infer<typeof ShopifyCredentialSchema>) {
    setIsSubmitting(true);

    try {
      await createCredential({
        type: 'shopify',
        data,
      });

      toast.success('Shopify integration created successfully!');
      router.push('/integrations');
    } catch (error) {
      console.error('Error creating integration:', error);
      toast.error('Failed to create integration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-2xl">
              🛍️
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Create Shopify Integration
              </h1>
              <p className="text-muted-foreground text-sm">
                Connect your Shopify store to publish blog articles
                automatically
              </p>
            </div>
          </div>

          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Watch YouTube tutorial</AlertTitle>
            <AlertDescription>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary mt-1 flex items-center gap-1 hover:underline"
              >
                Watch YouTube tutorial how to integrate your Shopify store with
                Outrank
                <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        </div>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Integration Name{' '}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Shopify Store"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      A friendly name to identify this integration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Store Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="my-store"
                        {...field}
                        disabled={isSubmitting}
                        onChange={(e) => {
                          // Auto-sanitize as user types
                          const sanitized = e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9-]/g, '');
                          field.onChange(sanitized);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your store subdomain only (e.g., 'my-store' not
                      'my-store.myshopify.com'). Lowercase letters, numbers, and
                      hyphens only.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Access Token <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="shpat_..."
                        type="password"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Your Shopify Admin API access token with blog permissions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blogId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Blog ID <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="120424792451"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your Shopify Blog ID (numeric ID only, e.g.
                      120424792451). Find it in your Shopify Admin under Online
                      Store → Blog posts → click on a blog → the ID is in the
                      URL.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="authorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Author Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Smith"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      The name that will appear as the author of blog posts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="publishingStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Publishing Status{' '}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select publishing status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="published">
                          Publish Immediately
                        </SelectItem>
                        <SelectItem value="draft">Save as Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose whether to publish articles immediately or save
                      them as drafts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Link href="/integrations">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Integration...
                    </>
                  ) : (
                    'Create Integration'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
