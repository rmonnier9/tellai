import { fetcher } from '@workspace/lib/swr-fetcher';
import React from 'react';
import useSWR from 'swr';
import { client } from '@workspace/auth/client';

type Props = {
  id?: string;
};

function useProduct({ id }: Props) {
  const query = useSWR(id ? `/api/products/${id}` : null, fetcher);

  return query;
}

export default useProduct;
