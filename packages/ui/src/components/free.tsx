'use client';

import React from 'react';
import { client } from '@workspace/auth/client';
import useSubscription from '@workspace/ui/hooks/use-subscription';

type Props = {
  children?: React.ReactNode;
};

function Free({ children }: Props) {
  const { data: activeOrg } = client.useActiveOrganization();
  const subscriptionQuery = useSubscription();

  return !subscriptionQuery?.data?.[0] ? children : null;
}

export default Free;
