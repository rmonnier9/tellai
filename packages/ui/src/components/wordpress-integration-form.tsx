'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, ExternalLink, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert';
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

import { createCredential } from '@workspace/lib/server-actions/create-credential';

const formSchema = z.object({
  siteUrl: z.string().url('Please enter a valid WordPress URL'),
});

export function WordPressIntegrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteUrl: '',
    },
  });

  // Generate API key when component mounts
  React.useEffect(() => {
    const token = `wp_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(token);
  }, []);

  // Watch the siteUrl field to generate the plugin install URL
  const siteUrl = form.watch('siteUrl');

  const getPluginInstallUrl = () => {
    if (!siteUrl) return '#';
    try {
      const url = new URL(siteUrl);
      return `${url.origin}/wp-admin/plugin-install.php?tab=upload`;
    } catch {
      return '#';
    }
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!apiKey) return;

    setIsSubmitting(true);

    try {
      await createCredential({
        type: 'wordpress',
        data: {
          name: `${new URL(data.siteUrl).hostname}`,
          siteUrl: data.siteUrl,
          applicationPassword: apiKey,
        },
      });

      toast.success('WordPress integration created successfully!');
      router.push('/integrations');
    } catch (error) {
      console.error('Error creating integration:', error);
      toast.error('Failed to create integration. Please try again.');
      setIsSubmitting(false);
    }
  }

  const copyApiKey = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      toast.success('Integration token copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create WordPress Integration
          </h1>
          <p className="mt-2 text-muted-foreground">
            Connect your WordPress site to automatically publish blog articles
          </p>
        </div>

        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <Info className="h-4 w-4" />
          <AlertTitle>
            Install and setup the Lovarank plugin to start publishing your
            content to your WordPress site.
          </AlertTitle>
          <AlertDescription>
            <a
              href="https://github.com/yourusername/lovarank-wordpress-plugin/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View full instructions
              <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="siteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Your WordPress Website URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://www.example.com"
                        type="url"
                        {...field}
                        disabled={isSubmitting}
                        className="text-base"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your WordPress URL with https:// (e.g.,
                      https://example.com or https://example.com/blog).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 rounded-lg border bg-muted/50 p-6">
                <h3 className="text-lg font-semibold">
                  Install and Setup Lovarank Plugin
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                      1
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="font-medium">
                        Install and Activate the Plugin
                      </p>
                      {siteUrl ? (
                        <>
                          <ul className="space-y-1.5 text-sm text-muted-foreground">
                            <li>
                              • Install the Lovarank plugin directly from here:
                            </li>
                          </ul>
                          <a
                            href={getPluginInstallUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" />
                              </svg>
                              Install Lovarank Plugin
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground italic">
                            Enter your WordPress URL above to enable the
                            installation button
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" />
                            </svg>
                            Install Lovarank Plugin
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li>• Click "Install Now" on the plugin page</li>
                        <li>
                          • Click "Activate" when the installation completes
                        </li>
                        <li>
                          • You'll be automatically redirected to the plugin
                          setup page
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                      2
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="font-medium">Configure the Plugin</p>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li>
                          • Copy the token below and paste it into the
                          "Integration Token" field:
                        </li>
                      </ul>
                      <div className="flex gap-2">
                        <Input
                          value={apiKey || ''}
                          readOnly
                          className="flex-1 font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={copyApiKey}
                          disabled={!apiKey}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li>• Click "Save" to establish the connection</li>
                        <li>
                          • Create an integration by clicking on the button
                          below
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

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
                <Button
                  type="submit"
                  disabled={isSubmitting || !apiKey}
                  className="min-w-[240px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Integration...
                    </>
                  ) : (
                    'Test Connection & Create Integration'
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
