import { useEffect, useRef } from 'react';
import useActiveContentPlannerJob from './use-active-content-planner-job';

type Props = {
  onComplete?: () => void | Promise<void>;
};

/**
 * Watches for content planner job completion and triggers a callback.
 * This hook detects when a job transitions from active (pending/running) to completed (null).
 *
 * @example
 * ```tsx
 * const { mutate } = useArticles({ productId });
 * useContentPlannerWatcher({
 *   onComplete: () => mutate()
 * });
 * ```
 */
function useContentPlannerWatcher({ onComplete }: Props = {}): {
  isJobActive: boolean;
  job: ReturnType<typeof useActiveContentPlannerJob>['data'];
} {
  const { data: job } = useActiveContentPlannerJob();
  const previousJobRef = useRef<typeof job>(undefined);

  useEffect(() => {
    const previousJob = previousJobRef.current;

    // Detect job completion: we had a job before, but now we don't
    // This means the job finished (either done or error, both are no longer active)
    if (previousJob && !job) {
      onComplete?.();
    }

    // Update the ref for next render
    previousJobRef.current = job;
  }, [job, onComplete]);

  return { isJobActive: !!job, job };
}

export default useContentPlannerWatcher;
