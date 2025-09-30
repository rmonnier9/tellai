'use client';

import React, { useMemo } from 'react';
import useActiveProduct from '../hooks/use-active-product';

type Props = {
  children?: React.ReactNode;
};

function Free({ children }: Props) {
  const currentProductQuery = useActiveProduct();
  const isPremium =
    currentProductQuery?.data?.subscription?.status === 'active' ||
    currentProductQuery?.data?.subscription?.status === 'trialing';

  return !isPremium ? children : null;
}

export default Free;
