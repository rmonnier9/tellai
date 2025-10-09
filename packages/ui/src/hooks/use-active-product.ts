import { client } from '@workspace/auth/client';
import useProduct from './use-product';
import { SWRConfiguration } from 'swr';

function useActiveProduct({
  swrConfig,
}: { swrConfig?: SWRConfiguration } = {}) {
  const session = client.useSession();
  const query = useProduct({
    id: (session.data?.session as any)?.activeProductId,
    swrConfig,
  });

  return query;
}

export default useActiveProduct;
