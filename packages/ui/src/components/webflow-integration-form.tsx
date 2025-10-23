'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Loader2 } from 'lucide-react';
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
  const [sites, setSites] = useState<
    Array<{
      id: string;
      displayName: string;
      shortName: string;
      customDomains?: Array<{ url: string }>;
    }>
  >([]);
  const [collections, setCollections] = useState<
    Array<{ id: string; displayName: string; slug: string }>
  >([]);
  const [collectionFields, setCollectionFields] = useState<
    Array<{
      slug: string;
      displayName: string;
      type: string;
      isEditable: boolean;
      isRequired: boolean;
      validations?: {
        collectionId?: string;
      };
    }>
  >([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>(
    {}
  );
  const [referenceOptions, setReferenceOptions] = useState<
    Record<string, Array<{ id: string; name: string }>>
  >({});

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
  console.log('collectionFields', collectionFields);

  const fetchSites = async (accessToken: string) => {
    if (!accessToken) {
      setSites([]);
      setCollections([]);
      setCollectionFields([]);
      setSelectedSiteId('');
      setFieldMappings({});
      return;
    }

    setIsLoadingSites(true);
    setSites([]);
    setCollections([]);
    setCollectionFields([]);
    setSelectedSiteId('');
    setFieldMappings({});

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

  const fetchReferenceItems = async (
    collectionId: string,
    fieldSlug: string
  ) => {
    const accessToken = form.getValues('accessToken');

    if (!accessToken || !collectionId) {
      return;
    }

    try {
      const response = await fetch(
        `/api/webflow/collections/${collectionId}/items`,
        {
          headers: {
            'x-webflow-token': accessToken,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch reference items');
        return;
      }

      const data = await response.json();

      if (data.items && Array.isArray(data.items)) {
        const options = data.items.map(
          (item: {
            id: string;
            fieldData?: { name?: string; title?: string };
          }) => ({
            id: item.id,
            name: item.fieldData?.name || item.fieldData?.title || item.id,
          })
        );

        setReferenceOptions((prev) => ({
          ...prev,
          [fieldSlug]: options,
        }));
      }
    } catch (error) {
      console.error('Error fetching reference items:', error);
    }
  };

  const fetchCollectionFields = async (collectionId: string) => {
    const accessToken = form.getValues('accessToken');

    if (!accessToken || !collectionId) {
      return;
    }

    setFieldMappings({}); // Clear previous mappings
    setReferenceOptions({}); // Clear previous reference options

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

      for (const field of data.fields) {
        if (field.type === 'Reference' && field.validations?.collectionId) {
          await fetchReferenceItems(field.validations.collectionId, field.slug);
        }
      }

      toast.success(
        `Loaded ${data.fields.length} field${data.fields.length > 1 ? 's' : ''}!`
      );
    } catch (error) {
      console.error('Error fetching fields:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch fields',
        { duration: 6000 }
      );
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
      const fieldMapping = Object.fromEntries(
        Object.entries(fieldMappings).filter(([, value]) => value !== '')
      );

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
          <AlertTitle>How to get your API token</AlertTitle>
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
                    <strong>cms:read/write</strong> - Required for field mapping
                    and to create articles
                  </li>
                </ul>
              </li>
            </ol>
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
                    <FormLabel>
                      Integration Name{' '}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Webflow Site"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
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
                      API Token <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter your Webflow API token"
                        {...field}
                        disabled={isSubmitting}
                        onChange={(e) => {
                          field.onChange(e);
                          fetchSites(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="siteUrl"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      Webflow Site <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={selectedSiteId}
                        onValueChange={handleSiteChange}
                        disabled={
                          isSubmitting || isLoadingSites || sites.length === 0
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose Webflow Site" />
                        </SelectTrigger>
                        <SelectContent>
                          {sites.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.displayName} ({site.shortName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="collectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Webflow Collection{' '}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleCollectionChange(value);
                        }}
                        disabled={
                          isSubmitting ||
                          isLoadingCollections ||
                          collections.length === 0
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose Webflow Collection" />
                        </SelectTrigger>
                        <SelectContent>
                          {collections.map((collection) => (
                            <SelectItem
                              key={collection.id}
                              value={collection.id}
                            >
                              {collection.displayName} ({collection.slug})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">Fields</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {collectionFields.length > 0
                        ? 'Map your app fields to the corresponding Webflow fields. App fields can be used multiple times.'
                        : 'Complete the form to choose fields'}
                    </p>
                  </div>
                </div>

                {collectionFields.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {collectionFields
                      .filter((field) => field.isEditable)
                      .map((field) => {
                        if (field.type === 'Switch') {
                          return (
                            <div key={field.slug} className="space-y-2">
                              <label className="text-sm font-medium">
                                {field.displayName}
                                {field.isRequired && (
                                  <span className="text-destructive ml-1">
                                    *
                                  </span>
                                )}
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
                                <SelectTrigger className="w-full">
                                  <SelectValue
                                    placeholder={`Choose value for ${field.displayName}`}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">True</SelectItem>
                                  <SelectItem value="false">False</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                {field.type}
                              </p>
                            </div>
                          );
                        }

                        const refOptions = referenceOptions[field.slug];
                        if (
                          field.type === 'Reference' &&
                          refOptions &&
                          refOptions.length > 0
                        ) {
                          return (
                            <div key={field.slug} className="space-y-2">
                              <label className="text-sm font-medium">
                                {field.displayName}
                                {field.isRequired && (
                                  <span className="text-destructive ml-1">
                                    *
                                  </span>
                                )}
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
                                <SelectTrigger className="w-full">
                                  <SelectValue
                                    placeholder={`Choose ${field.displayName}`}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {refOptions.map((option) => (
                                    <SelectItem
                                      key={option.id}
                                      value={option.id}
                                    >
                                      {option.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                {field.type}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div key={field.slug} className="space-y-2">
                            <label className="text-sm font-medium">
                              {field.displayName}
                              {field.isRequired && (
                                <span className="text-destructive ml-1">*</span>
                              )}
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
                              <SelectTrigger className="w-full">
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
                        );
                      })}
                  </div>
                ) : null}
              </div>

              <FormField
                control={form.control}
                name="publishingStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Publishing Behavior{' '}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Publish Immediately" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="live">
                          Publish Immediately
                        </SelectItem>
                        <SelectItem value="staged">
                          Stage for Publishing
                        </SelectItem>
                        <SelectItem value="draft">Save as Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
