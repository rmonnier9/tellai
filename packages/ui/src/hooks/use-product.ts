import { fetcher } from '@workspace/lib/swr-fetcher';
import React from 'react';
import useSWR from 'swr';
import { client } from '@workspace/auth/client';
import { getProduct } from '@workspace/lib/server-actions/get-product';

type Props = {
  id?: string;
};

function useProduct({ id }: Props) {
  const query = useSWR(id ? `/api/products/${id}` : null, async () =>
    getProduct({ id: id as string })
  );

  return query;
}

export default useProduct;
