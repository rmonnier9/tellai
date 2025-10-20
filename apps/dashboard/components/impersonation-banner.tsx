'use client';

import { client } from '@workspace/auth/client';
import { Button } from '@workspace/ui/components/button';
import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';

export function ImpersonationBanner() {
  const session = client.useSession();
  const [stopping, setStopping] = useState(false);

  // Check if impersonating - better-auth stores this in session.session.impersonatedBy
  const sessionData = session.data?.session as
    | { impersonatedBy?: string }
    | undefined;
  const isImpersonating = !!sessionData?.impersonatedBy;

  const handleStopImpersonation = async () => {
    try {
      setStopping(true);
      await client.admin.stopImpersonating({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = '/admin/users';
          },
          onError: (ctx) => {
            console.error('Failed to stop impersonation:', ctx.error);
            setStopping(false);
          },
        },
      });
    } catch (err) {
      console.error('Error stopping impersonation:', err);
      setStopping(false);
    }
  };

  if (!isImpersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground border-b border-destructive">
      <div className="container flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-4 w-4" />
          <p className="text-sm font-medium">
            You are currently impersonating a user
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleStopImpersonation}
          disabled={stopping}
          className="border-destructive-foreground/20 hover:bg-destructive-foreground/10"
        >
          {stopping ? 'Stopping...' : 'Stop Impersonation'}
        </Button>
      </div>
    </div>
  );
}
