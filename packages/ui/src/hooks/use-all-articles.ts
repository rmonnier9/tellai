import { getAllArticles } from '@workspace/lib/server-actions/get-all-articles';
import useSWR, { type SWRResponse } from 'swr';

type Props = {
  productId?: string;
};

type Articles = Awaited<ReturnType<typeof getAllArticles>>;

function useAllArticles({ productId }: Props): SWRResponse<Articles> {
  const query = useSWR(
    productId ? `/api/all-articles/${productId}` : null,
    async () => getAllArticles({ productId: productId as string })
  );

  return query;
}

export default useAllArticles;
