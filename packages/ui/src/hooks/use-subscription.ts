import React from 'react';
import useSWR from 'swr';
import { client } from '@workspace/auth/client';

type Props = {};

function useSubscription() {
  const { data: activeOrg } = client.useActiveOrganization();
  const query = useSWR(activeOrg?.id ? '/api/subscription' : null, {
    fetcher: async () => {
      const { data: subscriptions } = await client.subscription.list({
        query: {
          referenceId: activeOrg?.id,
        },
      });
      return subscriptions;
    },
  });

  return query;
}

export default useSubscription;
