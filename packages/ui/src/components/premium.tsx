'use client';

import React from 'react';
import { client } from '@workspace/auth/client';
import useSubscriptions from '@workspace/ui/hooks/use-subscriptions';

type Props = {
  children?: React.ReactNode;
};

function Premium({ children }: Props) {
  const subscriptionQuery = useSubscriptions();

  return subscriptionQuery?.data?.isPremium ? children : null;
}

export default Premium;
