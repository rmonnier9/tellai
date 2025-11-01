'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@workspace/ui/components/button';
import { Card } from '@workspace/ui/components/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

import { ShopifyCredentialSchema } from '@workspace/lib/dtos';
import { createCredential } from '@workspace/lib/server-actions/create-credential';

export function ShopifyIntegrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
  const [blogs, setBlogs] = useState<
    Array<{
      id: string;
      title: string;
      handle: string;
      numericId: string;
    }>
  >([]);

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

  const fetchBlogs = async (storeName: string, accessToken: string) => {
    if (!storeName || !accessToken) {
      setBlogs([]);
      return;
    }

    setIsLoadingBlogs(true);
    setBlogs([]);

    try {
      const response = await fetch('/api/shopify/blogs', {
        headers: {
          'x-shopify-access-token': accessToken,
          'x-shopify-store-name': storeName,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            'Failed to fetch blogs. Please check your credentials.'
        );
      }

      const data = await response.json();

      if (!data.blogs || data.blogs.length === 0) {
        throw new Error('No blogs found in your Shopify store.');
      }

      setBlogs(data.blogs);
      toast.success(
        `Found ${data.blogs.length} blog${data.blogs.length > 1 ? 's' : ''}!`
      );
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch blogs',
        { duration: 6000 }
      );
    } finally {
      setIsLoadingBlogs(false);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">
            Create Shopify Integration
          </h1>
          <p className="mt-2 text-muted-foreground">
            Connect your Shopify store to publish blog articles automatically
          </p>
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
                      <div className="flex">
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
                            // Auto-fetch blogs when both store name and access token are entered
                            const accessToken = form.getValues('accessToken');
                            if (sanitized && accessToken) {
                              fetchBlogs(sanitized, accessToken);
                            } else {
                              setBlogs([]);
                            }
                          }}
                          className="rounded-r-none"
                        />
                        <div className="flex items-center px-3 border border-l-0 border-input bg-muted text-muted-foreground rounded-r-md">
                          .myshopify.com
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter your store name (e.g., if your store URL is
                      &apos;my-store.myshopify.com&apos;, enter
                      &apos;my-store&apos;)
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
                        type="text"
                        {...field}
                        disabled={isSubmitting}
                        onChange={(e) => {
                          field.onChange(e);
                          // Auto-fetch blogs when both store name and access token are entered
                          const storeName = form.getValues('storeName');
                          if (storeName && e.target.value) {
                            fetchBlogs(storeName, e.target.value);
                          } else {
                            setBlogs([]);
                          }
                        }}
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
                      Blog <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={
                          isSubmitting || isLoadingBlogs || blogs.length === 0
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isLoadingBlogs
                                ? 'Loading blogs...'
                                : blogs.length === 0
                                  ? 'Enter store name and access token'
                                  : 'Please select a blog'
                            }
                          >
                            {blogs.find((b) => b.id === field.value)?.title ||
                              blogs.find((b) => b.numericId === field.value)
                                ?.title}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {blogs.map((blog) => (
                            <SelectItem key={blog.id} value={blog.id}>
                              ✓ {blog.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Select the blog where articles will be published
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
