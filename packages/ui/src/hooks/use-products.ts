import { fetcher } from '@workspace/lib/swr-fetcher';
import React, { use } from 'react';
import useSWR from 'swr';
import { client } from '@workspace/auth/client';
import { getProducts } from '@workspace/lib/server-actions/get-products';

function useProducts() {
  const { data: activeOrganization } = client.useActiveOrganization();
  const query = useSWR(
    activeOrganization?.id ? `/api/products` : null,
    async () => getProducts()
  );

  return query;
}

export default useProducts;
