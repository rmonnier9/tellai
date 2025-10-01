import { createAuthClient } from 'better-auth/react';
import {
  magicLinkClient,
  organizationClient,
  customSessionClient,
} from 'better-auth/client/plugins';
import { stripeClient } from '@better-auth/stripe/client';
import type { auth } from './server';

export const client = createAuthClient({
  plugins: [
    customSessionClient<typeof auth>(),
    magicLinkClient(),
    organizationClient(),
    stripeClient({
      subscription: true,
    }),
  ],
});
