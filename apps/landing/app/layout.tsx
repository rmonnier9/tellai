import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import MetaPixel from '@workspace/ui/components/meta-pixel';
import Analytics from '@workspace/ui/components/analytics';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Bricolage_Grotesque, Inter } from 'next/font/google';
import Script from 'next/script';

import '@workspace/ui/globals.css';
import './css/style.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

export async function generateMetadata() {
  const messages = await getMessages();
  const title =
    messages.meta.metaTitle ||
    'Lovarank | AI-powered SEO that works while you sleep';
  const description =
    messages.meta.metaDescription ||
    'A 100% automated growth engine: hidden keyword discovery, optimized articles, daily publishing.';

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_LANDING_PAGE_URL!),
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: `/api/og`,
        },
      ],
    },
    alternates: {
      canonical: '/',
      languages: {
        en: '/en',
        fr: '/fr',
      },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html className="scroll-smooth">
      <body
        className={`${inter.variable} ${bricolageGrotesque.variable} bg-gray-50 font-inter tracking-tight text-gray-900 antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
            {children}
          </div>
        </NextIntlClientProvider>
        <Script src="https://r.wdfl.co/rw.js" data-rewardful="5770ad"></Script>
        <Script id="rewardful-queue" strategy="beforeInteractive">
          {`(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`}
        </Script>

        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
        )}
        {process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID && (
          <GoogleTagManager
            gtmId={process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID!}
          />
        )}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID!} />
        )}
        <Analytics />
      </body>
    </html>
  );
}
