'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createCredential } from '@workspace/lib/server-actions/create-credential';
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
import { Copy, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
});

export function FramerIntegrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  // Generate API key when component mounts
  React.useEffect(() => {
    const token = `framer_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(token);
  }, []);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!apiKey) return;

    setIsSubmitting(true);

    try {
      await createCredential({
        type: 'framer',
        data: {
          name: data.name,
          apiKey: apiKey,
        },
      });

      toast.success('Framer integration created successfully!');
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
      toast.success('API key copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Framer Integration</h1>
          <p className="text-muted-foreground mt-2">
            Connect your Framer website to automatically sync articles from
            Lovarank.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Integration Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Framer Site"
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

            <div className="space-y-4 rounded-lg border p-6 bg-muted/30">
              <div>
                <h3 className="font-semibold mb-2">Your API Key</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Copy this API key and paste it into the Lovarank plugin in
                  Framer.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={apiKey || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyApiKey}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-6 bg-blue-50 dark:bg-blue-950">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  Setup Instructions
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Copy the API key above by clicking the copy button</li>
                  <li>Open your Framer project and go to CMS Collections</li>
                  <li>
                    Click "Add Plugin" and select "Lovarank" from the plugin
                    library
                  </li>
                  <li>Paste your API key when prompted</li>
                  <li>
                    Select which fields to sync and click "Import Articles"
                  </li>
                </ol>
              </div>

              <div className="pt-4 border-t">
                <a
                  href="https://www.framer.com/help/plugins/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  Learn more about Framer Plugins
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !apiKey}>
                {isSubmitting ? 'Creating...' : 'Create Integration'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
