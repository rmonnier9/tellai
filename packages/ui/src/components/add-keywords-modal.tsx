'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { cn } from '@workspace/ui/lib/utils';
import { Info } from 'lucide-react';
import * as React from 'react';

type AddKeywordsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableSlots: number;
  onSubmit: (keywords: string[]) => Promise<void>;
  isSubmitting?: boolean;
};

export function AddKeywordsModal({
  open,
  onOpenChange,
  availableSlots,
  onSubmit,
  isSubmitting = false,
}: AddKeywordsModalProps) {
  const [keywords, setKeywords] = React.useState('');
  const [error, setError] = React.useState('');

  // Parse keywords from textarea
  const parsedKeywords = React.useMemo(() => {
    if (!keywords.trim()) return [];

    // Split by commas and newlines, then filter empty strings
    return keywords
      .split(/[,\n]+/)
      .map((kw) => kw.trim())
      .filter((kw) => kw.length > 0);
  }, [keywords]);

  const keywordCount = parsedKeywords.length;
  const hasError = keywordCount > availableSlots;

  React.useEffect(() => {
    if (hasError) {
      setError(
        `You've entered ${keywordCount} keyword${keywordCount > 1 ? 's' : ''} but only ${availableSlots} slot${availableSlots !== 1 ? 's are' : ' is'} available`
      );
    } else {
      setError('');
    }
  }, [hasError, keywordCount, availableSlots]);

  const handleSubmit = async () => {
    if (keywordCount === 0) {
      setError('Please enter at least one keyword');
      return;
    }

    if (hasError) {
      return;
    }

    await onSubmit(parsedKeywords);

    // Reset form on success
    setKeywords('');
    setError('');
  };

  const handleClose = (open: boolean) => {
    if (!isSubmitting && !open) {
      setKeywords('');
      setError('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Keywords</DialogTitle>
          <DialogDescription>
            Enter keywords separated by commas or new lines. Keywords will be
            scheduled in available slots starting from today.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <textarea
              placeholder={
                'Enter keywords separated by commas\nExample: seo tips, content marketing, digital marketing'
              }
              value={keywords}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setKeywords(e.target.value)
              }
              className={cn(
                'flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50 resize-none'
              )}
              disabled={isSubmitting}
            />
            <div className="flex items-start gap-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  {keywordCount === 0 ? (
                    <span>
                      {availableSlots} keyword slot
                      {availableSlots !== 1 ? 's' : ''} available
                    </span>
                  ) : (
                    <span>
                      {keywordCount} keyword{keywordCount > 1 ? 's' : ''}{' '}
                      entered
                    </span>
                  )}
                </p>
                {error && (
                  <p className="text-destructive font-medium">{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={hasError || keywordCount === 0 || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Keywords'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddKeywordsModal;
