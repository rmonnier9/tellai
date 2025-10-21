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
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionFields, setCollectionFields] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
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

  const fetchSites = async () => {
    const accessToken = form.getValues('accessToken');

    if (!accessToken) {
      toast.error('Please enter your API Token first');
      return;
    }

    setIsLoadingSites(true);
    setSites([]);
    setCollections([]);
    setCollectionFields([]);
    setSelectedSiteId('');

    try {
      const response = await fetch('/api/webflow/sites', {
        headers: {
          'x-webflow-token': accessToken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            'Failed to fetch sites. Please check your API token.'
        );
      }

      const data = await response.json();

      if (!data.sites || data.sites.length === 0) {
        throw new Error('No sites found for this API token.');
      }

      setSites(data.sites);
      toast.success(
        `Found ${data.sites.length} site${data.sites.length > 1 ? 's' : ''}!`
      );
    } catch (error) {
      console.error('Error fetching sites:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch sites',
        { duration: 6000 }
      );
    } finally {
      setIsLoadingSites(false);
    }
  };

  const fetchCollections = async (siteId: string) => {
    const accessToken = form.getValues('accessToken');

    if (!accessToken || !siteId) {
      return;
    }

    setIsLoadingCollections(true);
    setCollections([]);
    setCollectionFields([]);

    try {
      const response = await fetch(`/api/webflow/sites/${siteId}/collections`, {
        headers: {
          'x-webflow-token': accessToken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch collections');
      }

      const data = await response.json();

      if (!data.collections || data.collections.length === 0) {
        throw new Error('No collections found for this site.');
      }

      setCollections(data.collections);
      toast.success(
        `Found ${data.collections.length} collection${data.collections.length > 1 ? 's' : ''}!`
      );
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch collections',
        { duration: 6000 }
      );
    } finally {
      setIsLoadingCollections(false);
    }
  };

  const fetchCollectionFields = async (collectionId: string) => {
    const accessToken = form.getValues('accessToken');

    if (!accessToken || !collectionId) {
      return;
    }

    setIsLoadingFields(true);
    try {
      const response = await fetch(`/api/webflow/collections/${collectionId}`, {
        headers: {
          'x-webflow-token': accessToken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch collection fields');
      }

      const data = await response.json();

      if (!data.fields || data.fields.length === 0) {
        throw new Error('No fields found in this collection.');
      }

      setCollectionFields(data.fields);
      setFieldMappingEnabled(true);
      toast.success(
        `Loaded ${data.fields.length} field${data.fields.length > 1 ? 's' : ''}!`
      );
    } catch (error) {
      console.error('Error fetching fields:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch fields',
        { duration: 6000 }
      );
    } finally {
      setIsLoadingFields(false);
    }
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    form.setValue('collectionId', '');

    // Find the selected site and set the URL
    const selectedSite = sites.find((s) => s.id === siteId);
    if (selectedSite) {
      // Automatically set the site URL
      const siteUrl =
        selectedSite.customDomains?.[0]?.url ||
        (selectedSite.shortName
          ? `https://${selectedSite.shortName}.webflow.io`
          : '');
      if (siteUrl) {
        form.setValue('siteUrl', siteUrl);
      }
    }

    fetchCollections(siteId);
  };

  const handleCollectionChange = (collectionId: string) => {
    form.setValue('collectionId', collectionId);
    fetchCollectionFields(collectionId);
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
            descriptionField:
              (document.getElementById('descriptionField') as HTMLSelectElement)
                ?.value || 'post-summary',
            imageField:
              (document.getElementById('imageField') as HTMLSelectElement)
                ?.value || 'main-image',
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
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your Webflow API token"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={fetchSites}
                        disabled={
                          isLoadingSites || !field.value || isSubmitting
                        }
                      >
                        {isLoadingSites ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load Sites'
                        )}
                      </Button>
                    </div>
                    <FormDescription>
                      Your Webflow API token with CMS permissions. Click "Load
                      Sites" to fetch your sites.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {sites.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Site</label>
                  <Select
                    value={selectedSiteId}
                    onValueChange={handleSiteChange}
                    disabled={isSubmitting || isLoadingCollections}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.displayName} ({site.shortName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the Webflow site where you want to publish articles
                  </p>
                </div>
              )}

              {collections.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select Collection
                  </label>
                  <Select
                    value={form.watch('collectionId')}
                    onValueChange={handleCollectionChange}
                    disabled={isSubmitting || isLoadingFields}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.displayName} ({collection.slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the CMS collection for your blog posts
                  </p>
                </div>
              )}

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
                <div className="mb-4">
                  <h3 className="font-medium">Field Mapping</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {collectionFields.length > 0
                      ? `Detected ${collectionFields.length} field${collectionFields.length !== 1 ? 's' : ''} from your Webflow collection. Map them to article data below. All fields are shown with their types.`
                      : 'Select a collection to automatically load and map fields'}
                  </p>
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
                        {collectionFields.map((field) => (
                          <option key={field.slug} value={field.slug}>
                            {field.displayName} ({field.slug}) - {field.type}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: Plain Text field for the article title
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
                        {collectionFields.map((field) => (
                          <option key={field.slug} value={field.slug}>
                            {field.displayName} ({field.slug}) - {field.type}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: Plain Text field set as the collection slug
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
                        {collectionFields.map((field) => (
                          <option key={field.slug} value={field.slug}>
                            {field.displayName} ({field.slug}) - {field.type}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: Rich Text field for the article content
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="descriptionField"
                        className="text-sm font-medium"
                      >
                        Description Field (Optional)
                      </label>
                      <select
                        id="descriptionField"
                        className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                        defaultValue="post-summary"
                      >
                        <option value="">-- Select field --</option>
                        {collectionFields.map((field) => (
                          <option key={field.slug} value={field.slug}>
                            {field.displayName} ({field.slug}) - {field.type}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: Plain Text field for the article meta
                        description / summary
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="imageField"
                        className="text-sm font-medium"
                      >
                        Featured Image Field (Optional)
                      </label>
                      <select
                        id="imageField"
                        className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                        defaultValue="main-image"
                      >
                        <option value="">-- Select field --</option>
                        {collectionFields.map((field) => (
                          <option key={field.slug} value={field.slug}>
                            {field.displayName} ({field.slug}) - {field.type}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: Image field for the article featured image
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click "Load Fields" to fetch and map your collection fields.
                    If not configured, default field names will be used (name,
                    slug, post-body, post-summary, main-image).
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
      </div>
    </div>
  );
}
