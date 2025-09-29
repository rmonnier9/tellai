import { client } from '@workspace/auth/client';
import useProduct from './use-product';

function useCurrentProduct() {
  const session = client.useSession();
  const query = useProduct({
    id: (session?.data?.session as any)?.activeProductId as string,
  });

  return query;
}

export default useCurrentProduct;
