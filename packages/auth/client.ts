import { stripeClient } from '@better-auth/stripe/client';
import {
  adminClient,
  customSessionClient,
  magicLinkClient,
  organizationClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import type { auth } from './server';

export const client = createAuthClient({
  plugins: [
    customSessionClient<typeof auth>(),
    magicLinkClient(),
    organizationClient(),
    adminClient(),
    stripeClient({
      subscription: true,
    }),
  ],
});
