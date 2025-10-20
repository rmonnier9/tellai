'use client';

import { client } from '@workspace/auth/client';
import { ImpersonationBanner } from './impersonation-banner';

export function ImpersonationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = client.useSession();

  const sessionData = session.data?.session as
    | { impersonatedBy?: string }
    | undefined;
  const isImpersonating = !!sessionData?.impersonatedBy;

  return (
    <>
      <ImpersonationBanner />
      <div className={isImpersonating ? 'pt-12' : ''}>{children}</div>
    </>
  );
}
