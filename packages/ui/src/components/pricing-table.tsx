'use client';

import { Check, Info } from 'lucide-react';
import { client } from '@workspace/auth/client';
import useActiveProduct from '../hooks/use-active-product';

const leftFeatures = [
  '30 Articles a month generated and published on auto-pilot',
  'Auto Keyword Research made for you hands-free',
  'High DR Backlinks built for you on auto-pilot through our Backlink Exchange',
  'Relevant YouTube videos integrated into articles',
  'Unlimited AI Rewrites',
];

const rightFeatures = [
  'Unlimited Users in your Organization',
  'Integrates with WordPress, Webflow, Shopify, Framer and many other platforms',
  'AI Images generated in different styles',
  'Articles generated in 150+ languages',
  'Custom Features requests',
];

export default function Example() {
  const activeProductQuery = useActiveProduct();

  const handleUpgrade = async () => {
    if (!activeProductQuery?.data?.id) {
      return alert('No product id');
    }

    await client.subscription.upgrade({
      plan: 'premium',
      cancelUrl: '/',
      successUrl: '/',
      referenceId: activeProductQuery?.data?.id,
      // annual: true, // Optional: upgrade to an annual plan
      // seats: 5, // Optional: for team plans
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto mt-16 max-w-6xl rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 sm:mt-20 dark:from-emerald-900/20 dark:to-emerald-800/20 dark:border-emerald-700/30">
        <div className="flex flex-col lg:flex-row">
          {/* Left side - Plan info and pricing */}
          <div className="p-8 sm:p-12 lg:w-1/3 lg:shrink-0">
            <div className="text-center lg:text-left">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                All in One
              </h2>
              <p className="text-emerald-600 font-medium mb-8 dark:text-emerald-400">
                For ambitious entrepreneurs
              </p>

              <div className="mb-8">
                <div className="flex items-baseline justify-center lg:justify-start gap-x-2 mb-2">
                  <span className="text-6xl font-bold text-gray-900 dark:text-white">
                    $99
                  </span>
                  <span className="text-2xl text-gray-400 line-through dark:text-gray-500">
                    $390
                  </span>
                  <span className="text-lg text-gray-600 dark:text-gray-400">
                    /monthly
                  </span>
                </div>
              </div>

              <button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-4 px-8 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl mb-6"
              >
                Start 3-day Trial for $1
              </button>

              <div className="text-center lg:text-left">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  Cancel anytime. No questions asked!
                </p>
                <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>$1 trial fee helps us ensure quality service.</span>
                  <Info className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Features */}
          <div className="p-8 sm:p-12 lg:flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              What's included:
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column features */}
              <div className="space-y-4">
                {leftFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5 dark:bg-emerald-800/50">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {feature.includes('Backlink Exchange') ? (
                        <>
                          <strong>High DR Backlinks</strong> built for you on
                          auto-pilot through our{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Backlink Exchange
                          </span>
                        </>
                      ) : feature.includes('other platforms') ? (
                        <>
                          Integrates with WordPress, Webflow, Shopify, Framer
                          and many{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            other platforms
                          </span>
                        </>
                      ) : (
                        <>
                          <strong>
                            {feature.split(' ')[0]}{' '}
                            {feature.split(' ')[1] || ''}
                          </strong>{' '}
                          {feature.split(' ').slice(2).join(' ')}
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Right column features */}
              <div className="space-y-4">
                {rightFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5 dark:bg-emerald-800/50">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {feature.includes('other platforms') ? (
                        <>
                          Integrates with WordPress, Webflow, Shopify, Framer
                          and many{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            other platforms
                          </span>
                        </>
                      ) : (
                        <>
                          <strong>
                            {feature.split(' ')[0]}{' '}
                            {feature.split(' ')[1] || ''}
                          </strong>{' '}
                          {feature.split(' ').slice(2).join(' ')}
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
