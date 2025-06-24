'use client';

import { AuthCard } from '@daveyplate/better-auth-ui';
import { GalleryVerticalEnd, HeartHandshake } from 'lucide-react';
export function AuthView({ pathname }: { pathname: string }) {
  return (
    // <main className="flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6 flex-1 min-h-screen min-w-screen">
    //   <AuthCard pathname={pathname} />
    // </main>

    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
            {/* <HeartHandshake className="size-4" /> */}
          </div>
          Lovadesk
        </a>
        <AuthCard pathname={pathname} />
      </div>
    </div>
  );
}
