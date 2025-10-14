'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

import { WebflowCredentialSchema } from '@workspace/lib/dtos';
import { createCredential } from '@workspace/lib/server-actions/create-credential';

export function WebflowIntegrationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [collectionFields, setCollectionFields] = useState<any[]>([]);
  const [fieldMappingEnabled, setFieldMappingEnabled] = useState(false);

  const form = useForm<z.infer<typeof WebflowCredentialSchema>>({
    resolver: zodResolver(WebflowCredentialSchema),
    defaultValues: {
      name: '',
      accessToken: '',
      collectionId: '',
      siteUrl: '',
      publishingStatus: 'draft',
    },
  });

  const fetchCollectionFields = async () => {
    const accessToken = form.getValues('accessToken');
    const collectionId = form.getValues('collectionId');

    if (!accessToken || !collectionId) {
      toast.error('Please enter both API Token and Collection ID first');
      return;
    }

    setIsLoadingFields(true);
    try {
      console.log('Fetching Webflow collection fields...', {
        collectionId: collectionId.substring(0, 10) + '...',
      });

      // Call our API route instead of Webflow directly to avoid CORS issues
      const response = await fetch(`/api/webflow/collections/${collectionId}`, {
        headers: {
          'x-webflow-token': accessToken,
        },
      });

      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);

        let errorMessage = 'Failed to fetch collection fields. ';

        if (response.status === 401) {
          errorMessage +=
            'Invalid API token. Please check that your token has the correct permissions (sites:read, cms:read).';
        } else if (response.status === 404) {
          errorMessage +=
            'Collection not found. Please verify your Collection ID is correct.';
        } else if (response.status === 403) {
          errorMessage +=
            'Access forbidden. Your API token may not have permission to access this collection.';
        } else {
          errorMessage += `Error ${response.status}: ${errorData.error || errorData.message || response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Collection data received:', {
        hasFields: !!data.fields,
        fieldCount: data.fields?.length || 0,
        fields: data.fields?.map((f: any) => ({
          slug: f.slug,
          type: f.type,
          displayName: f.displayName,
        })),
      });

      if (!data.fields || data.fields.length === 0) {
        throw new Error(
          'No fields found in this collection. Please make sure the collection has fields configured in Webflow.'
        );
      }

      setCollectionFields(data.fields);
      setFieldMappingEnabled(true);
      toast.success(
        `Loaded ${data.fields.length} field${data.fields.length > 1 ? 's' : ''} successfully!`
      );
    } catch (error) {
      console.error('Error fetching fields:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not fetch collection fields. Please check your API token and Collection ID.',
        {
          duration: 6000,
        }
      );
    } finally {
      setIsLoadingFields(false);
    }
  };

  async function onSubmit(data: z.infer<typeof WebflowCredentialSchema>) {
    setIsSubmitting(true);

    try {
      // Build field mapping if enabled
      const fieldMapping = fieldMappingEnabled
        ? {
            titleField:
              (document.getElementById('titleField') as HTMLSelectElement)
                ?.value || 'name',
            slugField:
              (document.getElementById('slugField') as HTMLSelectElement)
                ?.value || 'slug',
            contentField:
              (document.getElementById('contentField') as HTMLSelectElement)
                ?.value || 'post-body',
          }
        : undefined;

      const credentialData: z.infer<typeof WebflowCredentialSchema> = {
        ...data,
        fieldMapping,
      };

      await createCredential({
        type: 'webflow',
        data: credentialData,
      });

      toast.success('Webflow integration created successfully!');
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
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connect Webflow</h1>
          <p className="mt-2 text-muted-foreground">
            Publish articles directly to your Webflow CMS collection
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Before you begin</AlertTitle>
          <AlertDescription>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm">
              <li>
                Go to your Webflow Site Settings → Apps & Integrations → API
                Access
              </li>
              <li>
                Generate a new API token with these permissions:
                <ul className="ml-6 mt-1 list-disc text-xs">
                  <li>
                    <strong>sites:read</strong> - Required for field mapping
                  </li>
                  <li>
                    <strong>cms:read</strong> - Required for field mapping
                  </li>
                  <li>
                    <strong>cms:write</strong> - Required to create articles
                  </li>
                </ul>
              </li>
              <li>
                Find your blog collection ID (you can get it from the Collection
                settings in your Webflow CMS)
              </li>
            </ol>
            <Link
              href="https://developers.webflow.com/data/reference/authorization"
              target="_blank"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Learn more in Webflow documentation
              <ExternalLink className="h-3 w-3" />
            </Link>
          </AlertDescription>
        </Alert>

        <Card className="p-6">
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
                        placeholder="My Webflow Site"
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
                name="accessToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Token</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your Webflow API token"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Your Webflow API token with CMS permissions. You can
                      generate this in your Webflow Site Settings → Apps &
                      Integrations → API Access.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="collectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your blog collection ID"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      The ID of the CMS collection where blog posts will be
                      published. You can find this in your Webflow CMS
                      collection settings.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="siteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://yourdomain.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Your published Webflow site URL (e.g.,
                      https://yourdomain.com). This is used to generate direct
                      links to published articles. If not provided, only the
                      slug will be stored.
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
                    <FormLabel>Publishing Status</FormLabel>
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
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Whether to publish articles as drafts or make them live
                      immediately
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium">Field Mapping (Optional)</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Map your Webflow collection fields to article data
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchCollectionFields}
                    disabled={isLoadingFields || isSubmitting}
                  >
                    {isLoadingFields ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load Fields'
                    )}
                  </Button>
                </div>

                {fieldMappingEnabled && collectionFields.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="titleField"
                        className="text-sm font-medium"
                      >
                        Title Field
                      </label>
                      <select
                        id="titleField"
                        className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                        defaultValue="name"
                      >
                        <option value="">-- Select field --</option>
                        {collectionFields
                          .filter((f) => f.type === 'PlainText')
                          .map((field) => (
                            <option key={field.slug} value={field.slug}>
                              {field.displayName} ({field.slug})
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Plain Text field for the article title
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="slugField"
                        className="text-sm font-medium"
                      >
                        Slug Field
                      </label>
                      <select
                        id="slugField"
                        className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                        defaultValue="slug"
                      >
                        <option value="">-- Select field --</option>
                        {collectionFields
                          .filter((f) => f.type === 'PlainText')
                          .map((field) => (
                            <option key={field.slug} value={field.slug}>
                              {field.displayName} ({field.slug})
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Plain Text field for the URL slug (must be set as
                        collection slug)
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="contentField"
                        className="text-sm font-medium"
                      >
                        Content Field
                      </label>
                      <select
                        id="contentField"
                        className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                        defaultValue="post-body"
                      >
                        <option value="">-- Select field --</option>
                        {collectionFields
                          .filter((f) => f.type === 'RichText')
                          .map((field) => (
                            <option key={field.slug} value={field.slug}>
                              {field.displayName} ({field.slug})
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Rich Text field for the article content
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click "Load Fields" to fetch and map your collection fields.
                    If not configured, default field names will be used (name,
                    slug, post-body).
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/integrations')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Connect Webflow
                </Button>
              </div>
            </form>
          </Form>
        </Card>

        <Alert variant="default" className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">
            How to find your Collection ID
          </AlertTitle>
          <AlertDescription className="text-blue-800">
            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm">
              <li>Open your Webflow Designer</li>
              <li>Go to the CMS tab</li>
              <li>Click on your blog collection</li>
              <li>Click on the settings icon (⚙️)</li>
              <li>
                The Collection ID is shown in the Collection Settings panel
              </li>
            </ol>
            <p className="mt-2 text-sm">
              Alternatively, you can use the Webflow API to list all your
              collections and find the ID programmatically.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
