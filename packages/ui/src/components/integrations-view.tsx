'use client';

import { deleteCredential } from '@workspace/lib/server-actions/delete-credential';
import { getCredentials } from '@workspace/lib/server-actions/get-credentials';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import { Card } from '@workspace/ui/components/card';
import { CirclePlus, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './empty';

type Credential = {
  id: string;
  type: string;
  name: string | null;
  config: any;
  createdAt: Date;
};

const integrationLogos: Record<string, string> = {
  shopify: '/images/shopify.svg',
  wordpress: '/images/wordpress.svg',
  'wordpress.com': '/images/wordpress-com.svg',
  webflow: '/images/webflow.svg',
  webhook: '/images/webhook.svg',
  notion: '/images/notion.svg',
  framer: '/images/framer.svg',
  wix: '/images/wix.svg',
};

const integrationLabels: Record<string, string> = {
  shopify: 'Shopify',
  wordpress: 'WordPress',
  webflow: 'Webflow',
  webhook: 'API Webhook',
};

export function IntegrationsView() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, []);

  async function loadCredentials() {
    try {
      const data = await getCredentials();
      setCredentials(data);
    } catch (error) {
      console.error('Error loading credentials:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!credentialToDelete) return;

    setDeleting(true);
    try {
      await deleteCredential(credentialToDelete);
      toast.success('Integration deleted successfully');
      setCredentials(credentials.filter((c) => c.id !== credentialToDelete));
      setDeleteDialogOpen(false);
      setCredentialToDelete(null);
    } catch (error) {
      console.error('Error deleting credential:', error);
      toast.error('Failed to delete integration');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground mt-2">
              Connect your blog or website with Lovarank to publish articles
              automatically
            </p>
          </div>
          <Link href="/integrations/new">
            <Button>
              <CirclePlus className="h-4 w-4" />
              Create Integration
            </Button>
          </Link>
        </div>

        {credentials.length === 0 ? (
          <Card>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CirclePlus />
                </EmptyMedia>
                <EmptyTitle>No Integrations yet</EmptyTitle>
                <EmptyDescription>
                  You haven&apos;t created any integrations yet. Get started by
                  creating your first integration.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-2">
                  <Link href="/integrations/new">
                    <Button>
                      <CirclePlus className="h-4 w-4" />
                      Create Integration
                    </Button>
                  </Link>
                  {/* <Button variant="outline">Import Project</Button> */}
                </div>
              </EmptyContent>
              {/* <Button
                variant="link"
                asChild
                className="text-muted-foreground"
                size="sm"
              >
                <a href="#">
                  Learn More <ArrowUpRightIcon />
                </a>
              </Button> */}
            </Empty>
          </Card>
        ) : (
          // <Card className="flex flex-col items-center justify-center p-12 text-center">
          //   <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          //     <Plus className="h-8 w-8 text-muted-foreground" />
          //   </div>
          //   <h3 className="mb-2 text-lg font-semibold">
          //     No Integrations just yet
          //   </h3>
          //   <Link href="/integrations/new">
          //     <Button>Create Your First Integration</Button>
          //   </Link>
          // </Card>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {credentials.map((credential) => (
              <Card key={credential.id} className="flex flex-col p-6 h-full">
                <div className="flex items-start justify-between flex-1">
                  <div className="flex items-start gap-3">
                    <div className="bg-white flex h-12 w-12 items-center justify-center rounded-lg p-2 shadow-sm">
                      <Image
                        src={
                          integrationLogos[credential.type] ||
                          '/images/webhook.svg'
                        }
                        alt={`${credential.type} logo`}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {credential.name ||
                          integrationLabels[credential.type] ||
                          'Integration'}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {integrationLabels[credential.type] || credential.type}
                      </p>
                      {credential.config?.storeName && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {credential.config.storeName}
                        </p>
                      )}
                      {credential.config?.siteUrl && (
                        <a
                          href={credential.config.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary mt-1 flex items-center gap-1 text-xs hover:underline"
                        >
                          {credential.config.siteUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive -mt-1 -mr-2"
                    onClick={() => {
                      setCredentialToDelete(credential.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Created{' '}
                      {new Date(credential.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              integration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
