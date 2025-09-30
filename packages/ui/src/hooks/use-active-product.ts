import { client } from '@workspace/auth/client';
import useProduct from './use-product';

function useActiveProduct() {
  const session = client.useSession();
  const query = useProduct({
    id: (session.data?.session as any)?.activeProductId,
  });

  return query;
}

export default useActiveProduct;
