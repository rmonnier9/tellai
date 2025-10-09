import { fetcher } from '@workspace/lib/swr-fetcher';
import React from 'react';
import useSWR, { SWRConfiguration } from 'swr';
import { getProduct } from '@workspace/lib/server-actions/get-product';

type Props = {
  id?: string;
  swrConfig?: SWRConfiguration;
};

function useProduct({ id, swrConfig }: Props = {}) {
  const query = useSWR(
    id ? `/api/products/${id}` : null,
    async () => getProduct({ id: id as string }),
    {
      ...swrConfig,
    }
  );

  return query;
}

export default useProduct;
