import ToolPage from '@/components/tool-page';
import { Metadata, ResolvingMetadata } from 'next';

import { tools } from '@workspace/lib/data/tools';
import { locales } from '@/i18n/routing';
import { notFound } from 'next/navigation';

// Generate FAQ schema from tool data
const generateFaqSchema = (toolId: string) => {
  const tool = tools.find((t) => t.id === toolId);
  if (!tool) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
};

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Generate static params for all tools and locales at build time
export async function generateStaticParams() {
  return locales.flatMap((locale) =>
    tools.map((tool) => ({
      locale,
      slug: tool.id,
    }))
  );
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata | undefined> {
  const { slug } = await params;
  const tool = tools.find((tool) => tool.id === slug);
  const previousImages = (await parent).openGraph?.images || [];

  if (!tool) {
    return;
  }

  const { title, description } = tool;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [...previousImages],
    },
  };
}

export default async function Tool({ params }: Props) {
  const { slug } = await params;
  const tool = tools.find((t) => t.id === slug);

  if (!tool) {
    return notFound();
  }

  const faqSchema = generateFaqSchema(slug);

  return (
    <>
      {/* SEO-optimized structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: tool.title,
            description: tool.description,
            applicationCategory: 'SEO Tool',
            operatingSystem: 'Web',
            url: `https://lovarank.com/tools/${slug}`,
            offers: {
              '@type': 'Offer',
              price: '99',
              priceCurrency: 'USD',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '200',
            },
          }),
        }}
      />
      {/* FAQ Schema for rich snippets */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}
      <ToolPage tool={tool} />
    </>
  );
}
