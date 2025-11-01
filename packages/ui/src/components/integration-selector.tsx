'use client';

import { Card } from '@workspace/ui/components/card';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const integrations = [
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Connect your WordPress site',
    logo: '/images/wordpress.svg',
    color: 'from-blue-500/10 to-blue-600/10',
    borderColor: 'hover:border-blue-500/50',
    available: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync with your Notion workspace',
    logo: '/images/notion.svg',
    color: 'from-gray-500/10 to-gray-600/10',
    borderColor: 'hover:border-gray-500/50',
    available: false,
  },
  {
    id: 'webflow',
    name: 'Webflow',
    description: 'Publish to your Webflow site',
    logo: '/images/webflow.svg',
    color: 'from-violet-500/10 to-violet-600/10',
    borderColor: 'hover:border-violet-500/50',
    available: true,
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Integrate with your Shopify store blog',
    logo: '/images/shopify.svg',
    color: 'from-green-500/10 to-green-600/10',
    borderColor: 'hover:border-green-500/50',
    available: true,
  },
  {
    id: 'wix',
    name: 'Wix',
    description: 'Connect your Wix website',
    logo: '/images/wix.svg',
    color: 'from-orange-500/10 to-orange-600/10',
    borderColor: 'hover:border-orange-500/50',
    available: false,
  },
  {
    id: 'wordpress-com',
    name: 'WordPress.com',
    description: 'Connect your WordPress.com site',
    logo: '/images/wordpress-com.svg',
    color: 'from-blue-500/10 to-blue-600/10',
    borderColor: 'hover:border-blue-500/50',
    available: false,
  },
  {
    id: 'webhook',
    name: 'API Webhook',
    description: 'Custom webhook integration',
    logo: '/images/webhook.svg',
    color: 'from-purple-500/10 to-purple-600/10',
    borderColor: 'hover:border-purple-500/50',
    available: false,
  },
  {
    id: 'framer',
    name: 'Framer',
    description: 'Publish to your Framer site',
    logo: '/images/framer.svg',
    color: 'from-pink-500/10 to-pink-600/10',
    borderColor: 'hover:border-pink-500/50',
    available: true,
  },
];

export function IntegrationSelector() {
  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight font-display">
          Add New Integration
        </h1>
        <p className="text-muted-foreground">
          Connect your website with Lovarank
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {integrations.map((integration) => {
          const content = (
            <Card
              key={integration.id}
              className={`group relative cursor-pointer overflow-hidden border-2 p-6 transition-all hover:shadow-lg h-60 ${
                integration.available
                  ? integration.borderColor
                  : 'cursor-not-allowed opacity-50'
              }`}
            >
              <div
                className={`bg-gradient-to-br ${integration.color} absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100`}
              />
              <div className="relative flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white p-3 shadow-sm">
                  <Image
                    src={integration.logo}
                    alt={`${integration.name} logo`}
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <h3 className="mb-1 font-semibold">{integration.name}</h3>
                <p className="text-muted-foreground text-sm">
                  {integration.description}
                </p>
                <div className="mt-auto">
                  {integration.available && (
                    <ArrowRight className="mt-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  )}
                  {!integration.available && (
                    <span className="mt-3 text-xs text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );

          return integration.available ? (
            <Link
              key={integration.id}
              href={`/integrations/new/${integration.id}`}
            >
              {content}
            </Link>
          ) : (
            <div key={integration.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
