import { createAuthClient } from 'better-auth/react';
import {
  magicLinkClient,
  organizationClient,
} from 'better-auth/client/plugins';

export const client = createAuthClient({
  plugins: [magicLinkClient(), organizationClient()],
});
