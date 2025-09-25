'use client';

import React from 'react';
import { useActiveOrganization } from '@workspace/auth/react';
import useSubscription from '../hooks/use-subscription';

type Props = {};

function Premium({}: Props) {
  const subscriptionQuery = useSubscription();

  console.log('subscription', subscriptionQuery?.data?.[0]);

  return <div>premium</div>;
}

export default Premium;
