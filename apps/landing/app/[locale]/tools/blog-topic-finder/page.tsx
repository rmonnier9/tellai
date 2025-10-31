import BlogTopicFinder from '@/components/blog-topic-finder';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'Free Blog Topic Generator | AI-Powered SEO Blog Ideas Generator | Lovarank',
  description:
    'Generate unlimited SEO-optimized blog topics instantly with our free AI blog topic generator. Analyze any website and get personalized blog ideas with long-tail keywords. No sign-up required.',
  keywords: [
    'blog topic generator',
    'blog ideas generator',
    'free blog topic generator',
    'blog topic finder',
    'blog ideas tool',
    'SEO blog topics',
    'blog content ideas',
    'article topic generator',
    'blog post ideas',
    'content ideas generator',
    'blog topic suggestions',
    'AI blog ideas',
    'content planning tool',
    'blog topic research',
    'content ideation tool',
    'keyword-based blog topics',
  ],
  openGraph: {
    title: 'Free Blog Topic Generator | AI-Powered SEO Blog Ideas',
    description:
      'Generate unlimited SEO-optimized blog topics instantly. Analyze any website and get AI-powered blog ideas with long-tail keywords tailored to your content strategy.',
    type: 'website',
    url: 'https://lovarank.com/tools/blog-topic-finder',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Blog Topic Generator | AI-Powered SEO Blog Ideas',
    description:
      'Generate unlimited SEO-optimized blog topics instantly with our free AI blog topic generator. No sign-up required.',
  },
  alternates: {
    canonical: '/tools/blog-topic-finder',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a blog topic generator?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A blog topic generator is an AI-powered tool that helps content creators and marketers discover relevant blog post ideas based on their website content, target keywords, and audience interests. Our generator analyzes your website and suggests SEO-optimized topics with long-tail keywords.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the blog topic generator work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Simply enter your website URL, and our AI analyzes your existing content, identifies key themes and topics, and generates 10 unique blog post ideas with relevant keywords. The tool uses advanced AI to understand your brand voice and suggest topics that align with your content strategy.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the blog topic generator free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, our blog topic generator is completely free to use. You can generate unlimited blog topic ideas without signing up or providing payment information.',
      },
    },
    {
      '@type': 'Question',
      name: 'What makes this blog topic generator different?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our generator goes beyond simple keyword suggestions. It analyzes your actual website content to understand your brand, industry, and audience, then generates highly relevant topics with long-tail keywords that are optimized for SEO and tailored to your specific niche.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use these blog topics for any website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, the generated blog topics are tailored to the website URL you provide. Simply enter any website URL to get personalized topic suggestions. The topics are designed to help improve SEO and engage your target audience.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do the generated topics include keywords for SEO?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, each generated blog topic includes a primary keyword optimized for SEO. These keywords are selected based on search volume, relevance to your content, and competition level to help improve your search engine rankings.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I turn these ideas into full blog posts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "After generating blog topics, you can use Lovarank's AI content engine to turn these ideas into complete, SEO-optimized articles. Our platform can generate full blog posts with proper structure, headings, and optimized content ready for publication.",
      },
    },
  ],
};

export default function BlogTopicFinderPage() {
  return (
    <>
      {/* SEO-optimized structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Blog Topic Generator',
            description:
              'Free AI-powered blog topic generator that analyzes websites and generates SEO-optimized blog ideas with long-tail keywords',
            applicationCategory: 'SEO Tool',
            operatingSystem: 'Web',
            url: 'https://lovarank.com/tools/blog-topic-finder',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '150',
            },
          }),
        }}
      />
      {/* FAQ Schema for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <BlogTopicFinder />
    </>
  );
}
