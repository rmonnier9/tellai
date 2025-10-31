'use client';

import Accordion from '@/components/accordion';
import {
  ArrowRight,
  Brain,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface BlogIdea {
  title: string;
  keyword: string;
  description: string;
}

export default function BlogTopicFinder() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<BlogIdea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const normalizeUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return trimmed;

    // Check if it already has a protocol
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // If it looks like a domain, prepend https://
    // Simple check: contains at least one dot and doesn't have spaces
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      return `https://${trimmed}`;
    }

    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setIdeas([]);

    const normalizedUrl = normalizeUrl(url);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/api/blog-topic-finder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: normalizedUrl }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate blog ideas');
      }

      const data = await response.json();
      setIdeas(data.ideas || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Scroll to results when ideas are generated
  useEffect(() => {
    if (ideas.length > 0 && resultsRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (resultsRef.current) {
          const header = document.querySelector('header');
          const headerHeight = header ? header.offsetHeight + 24 : 80; // Add extra padding
          const elementPosition =
            resultsRef.current.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - headerHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }, 100);
    }
  }, [ideas]);

  return (
    <>
      {/* Full-width Hero Section with Input */}
      <section className="relative min-h-[100svh] flex items-center justify-center bg-white pb-0 pt-8 md:pt-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            {/* Header */}
            <div className="mb-12" data-aos="zoom-y-out">
              <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl lg:text-6xl">
                Free Blog Topic Generator
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
                Analyze your website and discover 10 SEO-optimized blog article
                ideas tailored to your content
              </p>
            </div>

            {/* Input Form */}
            <div className="mb-8" data-aos="zoom-y-out" data-aos-delay={150}>
              <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUrl(value);
                    }}
                    onBlur={(e) => {
                      const normalized = normalizeUrl(e.target.value);
                      if (normalized !== e.target.value) {
                        setUrl(normalized);
                        // Update the input value to reflect the normalized URL
                        e.target.value = normalized;
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const normalized = normalizeUrl(e.currentTarget.value);
                        if (normalized !== e.currentTarget.value) {
                          setUrl(normalized);
                          // Update the input value to reflect the normalized URL
                          e.currentTarget.value = normalized;
                        }
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Enter your website URL (e.g., lovarank.com)"
                    className="flex-1 rounded-lg border border-gray-300 px-6 py-4 text-lg text-gray-900 placeholder-gray-500 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className="btn group w-full bg-linear-to-t from-pink-600 to-pink-500 bg-[length:100%_100%] bg-[bottom] px-8 py-4 text-lg text-white shadow-sm hover:bg-[length:100%_150%] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {loading ? (
                      <span className="inline-flex items-center">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        Generate Ideas
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="mx-auto max-w-3xl rounded-lg bg-red-50 border border-red-200 p-4 text-red-800"
                data-aos="fade-up"
              >
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="mx-auto max-w-3xl text-center" data-aos="fade-up">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
                  <Sparkles className="h-8 w-8 animate-pulse text-pink-600" />
                </div>
                <p className="text-lg font-medium text-gray-900">
                  Analyzing your website...
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Extracting content and generating SEO-optimized ideas
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      {ideas.length > 0 && (
        <section
          ref={resultsRef}
          className="relative bg-white pt-8 md:pt-12 pb-12 md:pb-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="space-y-8" data-aos="fade-up">
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Your Blog Article Ideas
                </h2>
                <p className="text-gray-600">
                  {ideas.length} SEO-optimized ideas based on your website
                </p>
              </div>

              {/* Ideas Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {ideas.map((idea, index) => (
                  <article
                    key={index}
                    className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    data-aos="fade-up"
                    data-aos-delay={index * 50}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                          {idea.title}
                        </h3>
                        <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                          <Tag className="h-4 w-4 text-pink-600" />
                          <span className="font-medium">Keyword:</span>
                          <span className="rounded-md bg-pink-50 px-2 py-1 text-pink-700">
                            {idea.keyword}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 rounded-lg bg-pink-100 p-2">
                        <FileText className="h-5 w-5 text-pink-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {idea.description}
                    </p>
                  </article>
                ))}
              </div>

              {/* CTA */}
              <div
                className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 p-8 text-center shadow-lg"
                data-aos="zoom-y-out"
              >
                <h3 className="mb-3 text-2xl font-bold text-gray-900">
                  Generate these articles automatically with Lovarank
                </h3>
                <p className="mb-6 text-gray-600">
                  Turn these ideas into fully optimized, ready-to-publish
                  articles with our AI-powered content engine
                </p>
                <a
                  href="https://app.lovarank.com/auth/sign-in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn group inline-flex items-center bg-linear-to-t from-pink-600 to-pink-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%]"
                >
                  <span className="relative inline-flex items-center">
                    Start Free Trial
                    <span className="ml-1 tracking-normal text-pink-300 transition-transform group-hover:translate-x-0.5">
                      -&gt;
                    </span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Informative Content Sections - Only shown when no results */}
      {ideas.length === 0 && (
        <section className="relative bg-white pb-12 pt-20 md:pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {/* Why Use Section */}
            <section className="mb-20" data-aos="fade-up">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
                  Why AI Blog Topic Generation Is Essential in 2025
                </h2>
                <p className="mb-8 text-lg leading-relaxed text-gray-600">
                  Content creators and marketers face constant pressure to
                  produce fresh, relevant blog ideas that resonate with their
                  audience and drive organic traffic. Our AI-powered blog topic
                  generator eliminates the guesswork by analyzing your website
                  content and generating data-driven topic suggestions that
                  align with your brand voice and SEO goals.
                </p>
                <p className="text-lg leading-relaxed text-gray-600">
                  Unlike generic topic generators, our tool understands your
                  specific industry, target audience, and content themes to
                  suggest topics that are both unique and optimized for search
                  engines. This means less time brainstorming and more time
                  creating content that converts.
                </p>
              </div>
            </section>

            {/* Features/Benefits Section */}
            <section className="mb-20" data-aos="fade-up">
              <div className="mx-auto max-w-3xl">
                <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 md:text-4xl">
                  The Ultimate Blog Content Ideas Generator
                </h2>
                <p className="mb-10 text-center text-lg text-gray-600">
                  Our blog topic generator streamlines your entire content
                  production workflow, combining intelligent topic generation
                  with SEO optimization to help you scale your content strategy.
                </p>

                <div className="grid gap-8 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100">
                      <Zap className="h-6 w-6 text-pink-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                      Generate Unlimited Ideas Instantly
                    </h3>
                    <p className="text-gray-600">
                      Get instant access to unlimited blog topic suggestions
                      based on your website analysis. No more staring at a blank
                      page wondering what to write about next.
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100">
                      <Brain className="h-6 w-6 text-pink-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                      Cut Time-Consuming Brainstorming
                    </h3>
                    <p className="text-gray-600">
                      Reduce hours of content ideation sessions to seconds. Our
                      AI analyzes your website and suggests topics tailored to
                      your audience, not just generic personas.
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100">
                      <Search className="h-6 w-6 text-pink-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                      SEO-Optimized Keywords Included
                    </h3>
                    <p className="text-gray-600">
                      Each topic comes with long-tail keywords selected based on
                      search volume, relevance, and competition to help improve
                      your search engine rankings.
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100">
                      <TrendingUp className="h-6 w-6 text-pink-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                      Scale Your Content Strategy
                    </h3>
                    <p className="text-gray-600">
                      Build a consistent content calendar with topics that align
                      with your brand voice and business objectives. Generate
                      ideas for weeks or months ahead in minutes.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="mb-20" data-aos="fade-up">
              <div className="mx-auto max-w-3xl">
                <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 md:text-4xl">
                  How to Generate Blog Topics With Our Tool
                </h2>
                <div className="space-y-8">
                  <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-600 text-lg font-bold text-white">
                        1
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Enter Your Website URL
                      </h3>
                    </div>
                    <p className="ml-14 text-gray-600">
                      Simply paste your website URL into the input field above.
                      Our AI will analyze your existing content, identifying key
                      themes, topics, and your brand voice to understand what
                      resonates with your audience.
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-600 text-lg font-bold text-white">
                        2
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Review AI-Generated Topic Ideas
                      </h3>
                    </div>
                    <p className="ml-14 text-gray-600">
                      Within seconds, you&apos;ll receive 10 unique blog topic
                      suggestions with SEO-friendly titles, primary keywords,
                      and brief descriptions. Each topic is designed to engage
                      your audience and improve your search visibility.
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-600 text-lg font-bold text-white">
                        3
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Turn Ideas Into Complete Articles
                      </h3>
                    </div>
                    <p className="ml-14 text-gray-600">
                      Use Lovarank&apos;s AI content engine to transform these
                      topic ideas into complete, SEO-optimized blog posts. Our
                      platform generates well-structured articles with proper
                      headings, engaging content, and optimized formatting ready
                      for publication.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      )}

      {/* FAQ Section - Always visible for SEO */}
      <section className="relative bg-white pb-20 pt-12" data-aos="fade-up">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600">
                Everything you need to know about our blog topic generator
              </p>
            </div>

            <div className="space-y-2">
              <Accordion id="faq-1" title="What is a blog topic generator?">
                A blog topic generator is an AI-powered tool that helps content
                creators and marketers discover relevant blog post ideas based
                on their website content, target keywords, and audience
                interests. Our generator analyzes your website and suggests
                SEO-optimized topics with long-tail keywords.
              </Accordion>

              <Accordion
                id="faq-2"
                title="How does the blog topic generator work?"
              >
                Simply enter your website URL, and our AI analyzes your existing
                content, identifies key themes and topics, and generates 10
                unique blog post ideas with relevant keywords. The tool uses
                advanced AI to understand your brand voice and suggest topics
                that align with your content strategy.
              </Accordion>

              <Accordion id="faq-3" title="Is the blog topic generator free?">
                Yes, our blog topic generator is completely free to use. You can
                generate unlimited blog topic ideas without signing up or
                providing payment information.
              </Accordion>

              <Accordion
                id="faq-4"
                title="What makes this blog topic generator different?"
              >
                Our generator goes beyond simple keyword suggestions. It
                analyzes your actual website content to understand your brand,
                industry, and audience, then generates highly relevant topics
                with long-tail keywords that are optimized for SEO and tailored
                to your specific niche.
              </Accordion>

              <Accordion
                id="faq-5"
                title="Can I use these blog topics for any website?"
              >
                Yes, the generated blog topics are tailored to the website URL
                you provide. Simply enter any website URL to get personalized
                topic suggestions. The topics are designed to help improve SEO
                and engage your target audience.
              </Accordion>

              <Accordion
                id="faq-6"
                title="Do the generated topics include keywords for SEO?"
              >
                Yes, each generated blog topic includes a primary keyword
                optimized for SEO. These keywords are selected based on search
                volume, relevance to your content, and competition level to help
                improve your search engine rankings.
              </Accordion>

              <Accordion
                id="faq-7"
                title="How can I turn these ideas into full blog posts?"
              >
                After generating blog topics, you can use Lovarank&apos;s AI
                content engine to turn these ideas into complete, SEO-optimized
                articles. Our platform can generate full blog posts with proper
                structure, headings, and optimized content ready for
                publication.
              </Accordion>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
