'use client';

import type { Tool } from '@workspace/lib/data/tools';

export default function ToolPage({ tool }: { tool: Tool }) {
  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
      <div className="pt-32 pb-12 md:pt-40 md:pb-20">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
          <h1 className="md:text-5xl text-3xl font-black mb-4">{tool.title}</h1>
          <p className="text-base md:text-lg text-gray-600">
            {tool.description}
          </p>
          <div className="mt-8">
            <a
              href={tool?.cta?.url || process.env.NEXT_PUBLIC_DASHBOARD_URL}
              className="btn text-white bg-primary-400 hover:bg-primary-500 w-full mb-4 sm:w-auto sm:mb-0"
            >
              Get Started for Free
            </a>
          </div>
        </div>

        {/* How It Works Section */}
        {tool.howItWorks?.length && (
          <div className="max-w-5xl mx-auto pb-12 md:pb-20">
            <div className="text-center pb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-lg md:text-xl text-gray-600">
                Everything you need to grow your organic traffic on autopilot
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
              {tool.howItWorks.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col items-start p-6 bg-white rounded-lg shadow-lg border border-gray-200"
                >
                  <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary-100 text-primary-600 font-bold text-xl">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center pb-12">
            <h2 className="h2 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            {tool.faq.map((item, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-lg shadow-md border border-gray-200"
              >
                <h3 className="text-lg font-bold mb-3">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto text-center pt-12 md:pt-20">
          <div className="p-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to ranking?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join 1,000+ businesses automating their way to the top of Google,
              ChatGPT and other AI search engines
            </p>
            <a
              href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
              className="btn text-primary-600 bg-white hover:bg-gray-100 w-full sm:w-auto"
            >
              Start Free Trial →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
