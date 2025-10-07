'use client';

import Link from 'next/link';
import { Card } from '@workspace/ui/components/card';
import { ArrowRight } from 'lucide-react';

const integrations = [
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Connect your WordPress site',
    icon: '📝',
    color: 'from-blue-500/10 to-blue-600/10',
    borderColor: 'hover:border-blue-500/50',
    available: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync with your Notion workspace',
    icon: '📓',
    color: 'from-gray-500/10 to-gray-600/10',
    borderColor: 'hover:border-gray-500/50',
    available: true,
  },
  {
    id: 'webflow',
    name: 'Webflow',
    description: 'Publish to your Webflow site',
    icon: '🌊',
    color: 'from-violet-500/10 to-violet-600/10',
    borderColor: 'hover:border-violet-500/50',
    available: true,
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Integrate with your Shopify store blog',
    icon: '🛍️',
    color: 'from-green-500/10 to-green-600/10',
    borderColor: 'hover:border-green-500/50',
    available: true,
  },
  {
    id: 'wix',
    name: 'Wix',
    description: 'Connect your Wix website',
    icon: '⚡',
    color: 'from-orange-500/10 to-orange-600/10',
    borderColor: 'hover:border-orange-500/50',
    available: true,
  },
  {
    id: 'wordpress-com',
    name: 'WordPress.com',
    description: 'Connect your WordPress.com site',
    icon: '📝',
    color: 'from-blue-500/10 to-blue-600/10',
    borderColor: 'hover:border-blue-500/50',
    available: true,
  },
  {
    id: 'webhook',
    name: 'API Webhook',
    description: 'Custom webhook integration',
    icon: '🔗',
    color: 'from-purple-500/10 to-purple-600/10',
    borderColor: 'hover:border-purple-500/50',
    available: true,
  },
  {
    id: 'framer',
    name: 'Framer',
    description: 'Publish to your Framer site',
    icon: '🎨',
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
          Connect your website with Outrank
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {integrations.map((integration) => {
          const content = (
            <Card
              key={integration.id}
              className={`group relative cursor-pointer overflow-hidden border-2 p-6 transition-all hover:shadow-lg ${
                integration.available
                  ? integration.borderColor
                  : 'cursor-not-allowed opacity-50'
              }`}
            >
              <div
                className={`bg-gradient-to-br ${integration.color} absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100`}
              />
              <div className="relative flex flex-col items-center text-center">
                <div className="mb-3 text-4xl">{integration.icon}</div>
                <h3 className="mb-1 font-semibold">{integration.name}</h3>
                <p className="text-muted-foreground text-sm">
                  {integration.description}
                </p>
                {integration.available && (
                  <ArrowRight className="mt-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                )}
                {!integration.available && (
                  <span className="mt-3 text-xs text-muted-foreground">
                    Coming soon
                  </span>
                )}
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
