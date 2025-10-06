'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Info, Code } from 'lucide-react';
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
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert';

import { WebhookCredentialSchema } from '@workspace/lib/dtos';
import { createCredential } from '@workspace/lib/server-actions/create-credential';

export function WebhookIntegrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof WebhookCredentialSchema>>({
    resolver: zodResolver(WebhookCredentialSchema),
    defaultValues: {
      name: '',
      webhookUrl: '',
      secret: '',
      headers: '',
    },
  });

  async function onSubmit(data: z.infer<typeof WebhookCredentialSchema>) {
    setIsSubmitting(true);

    try {
      // Validate headers JSON if provided
      if (data.headers && data.headers.trim()) {
        try {
          JSON.parse(data.headers);
        } catch {
          form.setError('headers', {
            message: 'Invalid JSON format',
          });
          setIsSubmitting(false);
          return;
        }
      }

      await createCredential({
        type: 'webhook',
        data,
      });

      toast.success('Webhook integration created successfully!');
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
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-2xl">
              🔗
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Create API Webhook Integration
              </h1>
              <p className="text-muted-foreground text-sm">
                Send article data to your custom endpoint
              </p>
            </div>
          </div>

          <Alert className="mb-6">
            <Code className="h-4 w-4" />
            <AlertTitle>Webhook Payload</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                When an article is generated, we'll send a POST request to your
                webhook URL with the following payload:
              </p>
              <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-3 text-xs">
                {`{
  "title": "Article Title",
  "content": "Article HTML content",
  "keyword": "target keyword",
  "publishUrl": "https://..."
}`}
              </pre>
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
                        placeholder="My Custom Webhook"
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
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Webhook URL <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://api.yourdomain.com/webhook"
                        type="url"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      The endpoint URL where article data will be sent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your-secret-key"
                        type="password"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional secret key for webhook verification (sent in
                      X-Webhook-Secret header)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="headers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Headers (JSON)</FormLabel>
                    <FormControl>
                      <textarea
                        className="placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={`{
  "Authorization": "Bearer token",
  "X-Custom-Header": "value"
}`}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional custom headers to include in the request (JSON
                      format)
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
