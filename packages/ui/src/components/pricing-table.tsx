'use client';

import { client } from '@workspace/auth/client';
import { Check } from 'lucide-react';
import useActiveProduct from '../hooks/use-active-product';
import { useRewardful } from '../hooks/use-rewardful';

const leftFeatures = [
  '30 premium articles created and published automatically each month',
  'Intelligent keyword research handled seamlessly in the background',
  'High-authority backlinks established automatically via our Link Network',
  'Curated YouTube content seamlessly embedded in articles',
  'Unlimited content revisions and improvements',
];

const rightFeatures = [
  'Unlimited team members and collaborators',
  'Seamless integration with WordPress, Webflow, Shopify, Framer and 50+ platforms',
  'AI-powered visuals created in multiple artistic styles',
  'Content generation across 150+ global languages',
  'Priority custom development requests',
];

interface PricingTableProps {
  initialProduct?: {
    id: string;
    subscription?: {
      status: string | null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    } | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  } | null;
}

export default function Example({ initialProduct }: PricingTableProps) {
  const activeProductQuery = useActiveProduct({
    swrConfig: {
      refreshInterval: 5000,
      // If we have initial data, use it as fallback
      fallbackData: initialProduct,
    },
  });
  const session = client.useSession();
  const { referralId } = useRewardful();

  const isLoading = session.isPending || activeProductQuery.isLoading;
  // Use initialProduct if activeProductQuery hasn't loaded yet
  const productData = activeProductQuery?.data || initialProduct;
  const productId = productData?.id;

  const handleUpgrade = async () => {
    // Get the latest product ID at the time of click
    const currentProductId = productData?.id;

    if (!currentProductId) {
      return alert('No product id');
    }

    if (referralId) {
      document.cookie = `rewardful_referral=${referralId}; path=/; max-age=3600; SameSite=Lax`;
    }

    await client.subscription.upgrade({
      plan: 'premium',
      cancelUrl: '/',
      successUrl: '/payment-success',
      referenceId: currentProductId,
      // annual: true, // Optional: upgrade to an annual plan
      // seats: 5, // Optional: for team plans
    });
  };

  return (
    <div className="max-w-7xl">
      <div className="mx-auto mt-16 max-w-6xl rounded-3xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 sm:mt-20 dark:from-primary-900/20 dark:to-primary-800/20 dark:border-primary-700/30">
        <div className="flex flex-col lg:flex-row">
          {/* Left side - Plan info and pricing */}
          <div className="p-8 sm:p-12 lg:w-1/3 lg:shrink-0">
            <div className="text-center lg:text-left">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                All in one
              </h2>
              <p className="text-primary-600 font-medium mb-8 dark:text-primary-400">
                Built for growing businesses
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
                disabled={!productId}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-4 px-8 rounded-full text-lg transition-all duration-200 shadow-lg hover:shadow-xl mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Start Free Trial'}
              </button>

              <div className="text-center lg:text-left">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  Cancel anytime. No commitments!
                </p>
                {/* <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>$1 trial fee helps us ensure quality service.</span>
                  <Info className="h-4 w-4" />
                </div> */}
              </div>
            </div>
          </div>

          {/* Right side - Features */}
          <div className="p-8 sm:p-12 lg:flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Everything you get:
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column features */}
              <div className="space-y-4">
                {leftFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5 dark:bg-primary-800/50">
                      <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {feature.includes('Backlink Exchange') ? (
                        <>
                          <strong>High DR Backlinks</strong> built for you on
                          auto-pilot through our{' '}
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
                            Backlink Exchange
                          </span>
                        </>
                      ) : feature.includes('other platforms') ? (
                        <>
                          Integrates with WordPress, Webflow, Shopify, Framer
                          and many{' '}
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
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
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5 dark:bg-primary-800/50">
                      <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {feature.includes('other platforms') ? (
                        <>
                          Integrates with WordPress, Webflow, Shopify, Framer
                          and many{' '}
                          <span className="text-primary-600 dark:text-primary-400 font-medium">
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
