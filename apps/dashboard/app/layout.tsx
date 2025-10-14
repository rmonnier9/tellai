import {
  Inter,
  // Geist,
  Geist_Mono,
  Bricolage_Grotesque,
} from 'next/font/google';
import { Toaster } from '@workspace/ui/components/sonner';
import Script from "next/script";

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
        <Script src="https://r.wdfl.co/rw.js" data-rewardful="5770ad"></Script>
        <Script id="rewardful-queue" strategy="beforeInteractive">
          {`(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`}
        </Script>
      </body>
    </html>
  );
}
