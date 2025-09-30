'use client';

import React from 'react';
import useActiveProduct from '../hooks/use-active-product';

type Props = {
  children?: React.ReactNode;
};

function Premium({ children }: Props) {
  const currentProductQuery = useActiveProduct();
  const isPremium =
    currentProductQuery?.data?.subscription?.status === 'active' ||
    currentProductQuery?.data?.subscription?.status === 'trialing';

  return isPremium ? children : null;
}

export default Premium;
