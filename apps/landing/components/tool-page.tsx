'use client';

import type { Tool } from '@workspace/lib/data/tools';
import CTA from '@workspace/ui/components/cta';
import SectionDivider from '@workspace/ui/components/section-divider';
import { cn } from '@workspace/ui/lib/utils';

const ContainerPadding = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('max-w-6xl px-8 md:px-12 py-16', className)}>
      {children}
    </div>
  );
};

const MediaContainer = ({
  children,
  className,
  bgImageUrl,
}: {
  children: React.ReactNode;
  className?: string;
  bgImageUrl?: string;
}) => {
  return (
    <div
      className={cn(
        'w-full relative flex items-center justify-center p-2 md:p-4 overflow-hidden',
        className
      )}
    >
      <img
        src={bgImageUrl || '/images/bg-1.jpeg'}
        alt="Media Container"
        width={1200}
        height={700}
        className="w-full h-auto absolute top-0 left-0"
      />
      <div className="absolute top-0 left-0 w-full h-full backdrop-blur-xs" />
      <div className="relative rounded-t-lg md:rounded-t-2xl overflow-hidden shadow-2xl transform translate-y-2 md:translate-y-6">
        {children}
      </div>
    </div>
  );
};
const ImageContainer = ({
  className,
  bgImageUrl,
  imageUrl,
  imageAlt,
}: {
  className?: string;
  bgImageUrl?: string;
  imageUrl: string;
  imageAlt?: string;
}) => {
  return (
    <MediaContainer bgImageUrl={bgImageUrl} className="border-y divider">
      <img
        src={imageUrl}
        alt={imageAlt}
        width={1200}
        height={700}
        className={cn('w-full h-auto overflow-hidden', className)}
      />
    </MediaContainer>
  );
};

export default function ToolPage({ tool }: { tool: Tool }) {
  return (
    <div className="relative">
      <div className="pt-24 md:pt-32 pb-12 px-2">
        {/* Hero Section */}

        <div className="border divider border-solid max-w-6xl mx-auto  rounded-4xl overflow-hidden">
          <section className="flex flex-col">
            <ContainerPadding className="pb-12 md:pb-16 mr-auto mr-auto md:py-24">
              <div className="inline-flex font-fun text-primary-400 text-3xl font-bold mb-4">
                {'This is the best'}
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                {tool.title}
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-4xl">
                {tool.description}
              </p>
              <div>
                <a
                  href={tool?.cta?.url || process.env.NEXT_PUBLIC_DASHBOARD_URL}
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started for Free
                </a>
              </div>
            </ContainerPadding>

            {/* Hero Image */}
            {/* <div className="w-full relative flex items-center justify-center p-4 overflow-hidden">
              <img
                src="/images/bg-2.jpeg"
                alt={tool.title}
                width={1200}
                height={700}
                className="w-full h-auto absolute top-0 left-0"
              />
              <div className="absolute top-0 left-0 w-full h-full backdrop-blur-xs" />
              <div className="relative rounded-t-2xl overflow-hidden shadow-2xl border border-gray-200 transform translate-y-6">
                <img
                  src="https://ferndesk.com/assets/ai-faq-hero.webp"
                  alt={tool.title}
                  width={1200}
                  height={700}
                  className="w-full h-auto overflow-hidden"
                />
              </div>
            </div> */}

            <ImageContainer
              className="w-full h-auto"
              imageUrl="/images/calendar.png"
              imageAlt={tool.title}
            />
          </section>

          <SectionDivider />

          {/* How It Works Section */}
          {tool.howItWorks?.length && (
            <section className="flex flex-col">
              <ContainerPadding>
                <div className="">
                  <div className="inline-flex  font-fun text-primary-400 text-3xl font-bold">
                    How It Works
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                    From Idea to Published Content in Minutes
                  </h2>
                  <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                    {
                      'Our AI-powered platform reads your content, understands your audience, and creates optimized content that ranks.'
                    }
                  </p>
                </div>
              </ContainerPadding>

              <ImageContainer
                imageUrl="/images/article.png"
                imageAlt="How it works demo"
              />
              {/* <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 mb-16">
                <img
                  src="/images/article.png"
                  alt="How it works demo"
                  width={1200}
                  height={700}
                  className="w-full h-auto"
                />
              </div> */}

              {/* Steps Grid */}
              <ContainerPadding>
                <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
                  {tool.howItWorks.map((step, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-lg flex-shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold mb-3">
                            {step.title}
                          </h3>
                          <p className="text-gray-600 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ContainerPadding>
            </section>
          )}

          <SectionDivider />
          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 md:pt-20">
            <div className="text-center pb-12 md:pb-16">
              <div className="inline-flex  font-fun text-primary-400 text-3xl font-bold mb-2">
                Lovarank
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600">
                Everything you need to know about our platform
              </p>
            </div>

            <div className="space-y-4">
              {tool.faq.map((item, index) => (
                <details
                  key={index}
                  className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer"
                >
                  <summary className="flex items-center justify-between font-semibold text-lg cursor-pointer list-none">
                    <span>{item.question}</span>
                    <svg
                      className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          <SectionDivider className="mt-12 md:mt-24" />

          {/* CTA Section */}
          <CTA />
        </div>
      </div>
    </div>
  );
}
