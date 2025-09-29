import { fetcher } from '@workspace/lib/swr-fetcher';
import React from 'react';
import useSWR from 'swr';
import { client } from '@workspace/auth/client';
import useProduct from './use-product';

type Props = {
  id?: string;
};

function useCurrentProduct({}: Props) {
  const query = useProduct({ id: '42' });

  return query;
}

export default useCurrentProduct;
