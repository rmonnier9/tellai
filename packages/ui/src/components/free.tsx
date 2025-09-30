'use client';

import React, { useMemo } from 'react';
import { client } from '@workspace/auth/client';
import useSubscriptions from '@workspace/ui/hooks/use-subscriptions';

type Props = {
  children?: React.ReactNode;
};

function Free({ children }: Props) {
  const subscriptionQuery = useSubscriptions();

  return !subscriptionQuery?.data?.isPremium ? children : null;
}

export default Free;
