'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { detectLinksFromSitemap } from '@workspace/lib/server-actions/detect-links';
import { saveLinkingConfiguration } from '@workspace/lib/server-actions/linking-configuration';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Separator } from '@workspace/ui/components/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@workspace/ui/components/sidebar';
import useActiveProduct from '@workspace/ui/hooks/use-active-product';
import { CheckCircle2, Info, Link2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DetectedLink {
  url: string;
  title?: string;
  keyword?: string;
}

export default function LinkingConfigurationPage() {
  const { data: product, isLoading: productLoading } = useActiveProduct();
  const [linkSource, setLinkSource] = useState<'database' | 'sitemap'>(
    'database'
  );
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detectedLinks, setDetectedLinks] = useState<DetectedLink[]>([]);
  const [totalUrls, setTotalUrls] = useState<number>(0);

  useEffect(() => {
    if (product) {
      setLinkSource(
        (product.linkSource as 'database' | 'sitemap') || 'sitemap'
      );
      setSitemapUrl(product.sitemapUrl || '');
      if (product.detectedLinks && Array.isArray(product.detectedLinks)) {
        setDetectedLinks(product.detectedLinks as unknown as DetectedLink[]);
      }
    }
  }, [product]);

  const handleDetectLinks = async () => {
    if (!product?.id || !sitemapUrl) {
      toast.error('Please enter a sitemap URL');
      return;
    }

    setIsDetecting(true);
    try {
      const result = await detectLinksFromSitemap(product.id, sitemapUrl);

      if (!result.success) {
        throw new Error(result.error || 'Failed to detect links');
      }

      if (result.links) {
        setDetectedLinks(result.links);
        setTotalUrls(result.totalUrls);
        toast.success(
          `Successfully detected ${result.totalUrls} links from your sitemap`
        );
      }
    } catch (error) {
      console.error('Error detecting links:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to detect links'
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!product?.id) return;

    if (linkSource === 'sitemap' && !sitemapUrl) {
      toast.error('Please enter a sitemap URL');
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveLinkingConfiguration(
        product.id,
        linkSource,
        sitemapUrl
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to save configuration');
      }

      toast.success('Linking configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save configuration'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (productLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!product) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">No active product</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Please select or create a product to continue.
              </p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Linking Configuration</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Linking Configuration
            </h1>
            <p className="text-muted-foreground">
              Configure how we find links on your website for internal linking
              and backlink exchange.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Source Configuration Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-purple-600" />
                  Source Configuration
                </CardTitle>
                {/* <CardDescription>
                  Choose your link source and configure settings
                </CardDescription> */}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Link Source Selection */}
                {/* <div className="space-y-2">
                  <Label htmlFor="linkSource">Choose Link Source</Label>
                  <Select
                    value={linkSource}
                    onValueChange={(value: 'database' | 'sitemap') =>
                      setLinkSource(value)
                    }
                  >
                    <SelectTrigger id="linkSource">
                      <SelectValue placeholder="Select link source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="database">
                        Database (Published Articles)
                      </SelectItem>
                      <SelectItem value="sitemap">Sitemap</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}

                {/* Sitemap URL Input */}
                {linkSource === 'sitemap' && (
                  <div className="space-y-2">
                    <Label htmlFor="sitemapUrl">Sitemap URL</Label>
                    <Input
                      id="sitemapUrl"
                      type="url"
                      placeholder="https://www.example.com/sitemap.xml"
                      value={sitemapUrl}
                      onChange={(e) => setSitemapUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Using sitemap from your{' '}
                      <a
                        href="/settings"
                        className="text-purple-600 hover:underline"
                      >
                        settings
                      </a>
                    </p>
                  </div>
                )}

                {/* Info Alert */}
                {linkSource === 'sitemap' && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      We scan your sitemap URL (and any nested sitemaps) to find
                      articles for linking. This works best if you have a
                      sitemap that is updated regularly.
                    </AlertDescription>
                  </Alert>
                )}

                {linkSource === 'database' && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      We will use published articles from your content history
                      for internal linking suggestions.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Detect Links Button */}
                {linkSource === 'sitemap' && (
                  <Button
                    onClick={handleDetectLinks}
                    disabled={!sitemapUrl || isDetecting}
                    className="w-full"
                    variant="outline"
                  >
                    {isDetecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Detecting Links...
                      </>
                    ) : (
                      'Detect Links'
                    )}
                  </Button>
                )}

                {/* Save Configuration Button */}
                <Button
                  onClick={handleSaveConfiguration}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Detected Links Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Detected Links
                </CardTitle>
                <CardDescription>
                  {linkSource === 'sitemap'
                    ? 'Choose your link source and click "Detect Links" to see the result'
                    : 'Links from your published articles'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {totalUrls === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Link2 className="mb-4 h-16 w-16 text-muted-foreground/30" />
                    <h3 className="mb-2 font-semibold">
                      Run a Link Detection to see the result
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {linkSource === 'sitemap'
                        ? 'Choose your link source and click "Detect Links" to find links from your website.'
                        : 'Publish some articles to see them appear here for internal linking.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                      <span className="text-sm font-medium">
                        Total Links Detected
                      </span>
                      <span className="text-lg font-bold text-purple-600">
                        {totalUrls}
                      </span>
                    </div>
                    <div className="max-h-[400px] space-y-2 overflow-y-auto">
                      {detectedLinks.slice(0, 10).map((link, index) => (
                        <div
                          key={index}
                          className="rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <p className="mb-1 font-medium text-sm">
                            {link.title || 'Untitled'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {link.url}
                          </p>
                        </div>
                      ))}
                      {totalUrls > 10 && (
                        <p className="py-2 text-center text-sm text-muted-foreground">
                          And {totalUrls - 10} more links...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
