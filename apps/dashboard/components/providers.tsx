'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { client } from '@workspace/auth/client';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <AuthUIProvider
        authClient={client}
        navigate={router.push}
        replace={router.replace}
        onSessionChange={() => {
          // Clear router cache (protected routes)
          router.refresh();
        }}
        Link={Link}
        social={{
          providers: ['google'],
        }}
        settings={{
          fields: [],
        }}
        magicLink
        credentials={false}
        organization={{
          logo: {
            upload: async (file) => {
              // Your upload logic
              return 'https://cdn.1min30.com/wp-content/uploads/2019/02/Le-logo-Apple.jpg';
            },
            size: 256,
            extension: 'png',
          },
          customRoles: [
            { role: 'developer', label: 'Developer' },
            { role: 'viewer', label: 'Viewer' },
          ],
        }}
      >
        {children}
      </AuthUIProvider>
    </NextThemesProvider>
  );
}
