import { getJob } from '@workspace/lib/server-actions/get-job';
import useSWR, { type SWRResponse } from 'swr';

type Props = {
  id?: string;
};

type Job = Awaited<ReturnType<typeof getJob>>;

function useJob({ id }: Props): SWRResponse<Job> {
  const query = useSWR(
    id ? `/api/jobs/${id}` : null,
    async () => getJob({ id: id as string }),
    {
      // Refresh every 5 seconds
      refreshInterval: (data) => {
        // Stop polling if job is done or errored
        if (data?.status === 'done' || data?.status === 'error') {
          return 0;
        }
        return 5000;
      },
      // Keep previous data while revalidating
      keepPreviousData: true,
    }
  );

  return query;
}

export default useJob;
