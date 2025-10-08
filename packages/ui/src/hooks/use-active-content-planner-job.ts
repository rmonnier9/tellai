import { getActiveContentPlannerJob } from '@workspace/lib/server-actions/get-active-content-planner-job';
import useSWR, { type SWRResponse } from 'swr';

type Job = Awaited<ReturnType<typeof getActiveContentPlannerJob>>;

function useActiveContentPlannerJob(): SWRResponse<Job> {
  const query = useSWR(
    '/api/jobs/active-content-planner',
    async () => getActiveContentPlannerJob(),
    {
      // Refresh every 5 seconds to check for active jobs
      // We poll continuously because:
      // 1. The query only returns pending/running jobs, not done/error ones
      // 2. We want to detect when new jobs are created
      // 3. The database query is indexed and efficient
      refreshInterval: 5000,
      // Keep previous data while revalidating to avoid UI flashing
      keepPreviousData: true,
    }
  );

  return query;
}

export default useActiveContentPlannerJob;
