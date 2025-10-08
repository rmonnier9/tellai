'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import useActiveContentPlannerJob from '../hooks/use-active-content-planner-job';
import { Spinner } from './spinner';

export function ContentPlannerModal() {
  const { data: job, isLoading } = useActiveContentPlannerJob();

  // Show modal only when there's an active job (pending or running)
  const isOpen = !isLoading && !!job;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent
        // Prevent closing on escape key or outside click
        onEscapeKeyDown={(e) => e.preventDefault()}
        // @ts-ignore
        onPointerDownOutside={(e: any) => e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            Creating Content Plan
          </AlertDialogTitle>
          {/* <AlertDialogDescription className="space-y-4"> */}
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
          <p className="text-center">
            We are currently analyzing your business and creating a
            comprehensive content plan. This may take a few minutes.
          </p>
          <p className="text-muted-foreground text-center text-xs">
            Please don&apos;t close this page. You&apos;ll be able to view your
            calendar once the process is complete.
          </p>
          {/* </AlertDialogDescription> */}
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ContentPlannerModal;
