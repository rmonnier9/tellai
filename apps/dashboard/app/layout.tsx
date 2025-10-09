import {
  Inter,
  // Geist,
  Geist_Mono,
  Bricolage_Grotesque,
} from 'next/font/google';
import { Toaster } from '@workspace/ui/components/sonner';

import '@workspace/ui/globals.css';
import { Providers } from '@/components/providers';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const fontDisplay = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <link rel="icon" href="/images/lovarank-logo-icon-2.svg" sizes="any" />
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable} font-sans antialiased `}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
