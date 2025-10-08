import { getArticles } from '@workspace/lib/server-actions/get-articles';
import useSWR, { type SWRResponse } from 'swr';

type Props = {
  productId?: string;
};

type Articles = Awaited<ReturnType<typeof getArticles>>;

function useArticles({ productId }: Props): SWRResponse<Articles> {
  const query = useSWR(
    productId ? `/api/articles/${productId}` : null,
    async () => getArticles({ productId: productId as string })
  );

  return query;
}

export default useArticles;
