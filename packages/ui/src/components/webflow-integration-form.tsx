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

// App fields that can be mapped to Webflow fields
const APP_FIELDS = [
  { value: 'title', label: 'Title' },
  { value: 'slug', label: 'Slug' },
  { value: 'metaDescription', label: 'Meta Description' },
  { value: 'publishDate', label: 'Publish Date' },
  { value: 'mainContent', label: 'Main Content' },
  { value: 'image', label: 'Image' },
];

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
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>(
    {}
  );

  const form = useForm<z.infer<typeof WebflowCredentialSchema>>({
    resolver: zodResolver(WebflowCredentialSchema),
    defaultValues: {
      name: '',
      accessToken: '',
      collectionId: '',
      siteUrl: '',
      publishingStatus: 'live',
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
    setFieldMappings({}); // Clear previous mappings
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
      // Build field mapping if enabled - filter out empty values
      const fieldMapping = fieldMappingEnabled
        ? Object.fromEntries(
            Object.entries(fieldMappings).filter(([, value]) => value !== '')
          )
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
                      ? 'Map your app fields to the corresponding Webflow fields. App fields can be used multiple times.'
                      : 'Select a collection to automatically load and map fields'}
                  </p>
                </div>

                {fieldMappingEnabled && collectionFields.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {collectionFields.map((field) => (
                      <div key={field.slug} className="space-y-2">
                        <label className="text-sm font-medium">
                          {field.displayName}
                        </label>
                        <Select
                          value={fieldMappings[field.slug]}
                          onValueChange={(value) => {
                            setFieldMappings((prev) => ({
                              ...prev,
                              [field.slug]: value,
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={`Choose ${field.displayName}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {APP_FIELDS.map((appField) => (
                              <SelectItem
                                key={appField.value}
                                value={appField.value}
                              >
                                {appField.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {field.type}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a collection to load fields and map your app fields
                    to Webflow fields. If not configured, default mappings will
                    be used.
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
