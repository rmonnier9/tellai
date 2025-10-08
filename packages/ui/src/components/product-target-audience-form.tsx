'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { UseFormReturn } from 'react-hook-form';

interface ProductTargetAudienceFormProps {
  form: UseFormReturn<any>;
}

export function ProductTargetAudienceForm({
  form,
}: ProductTargetAudienceFormProps) {
  const [targetAudienceInput, setTargetAudienceInput] = useState('');

  const addTargetAudience = () => {
    if (targetAudienceInput.trim()) {
      const currentAudiences = form.getValues('targetAudiences') || [];
      form.setValue('targetAudiences', [
        ...currentAudiences,
        targetAudienceInput.trim(),
      ]);
      setTargetAudienceInput('');
    }
  };

  const removeTargetAudience = (index: number) => {
    const currentAudiences = form.getValues('targetAudiences') || [];
    form.setValue(
      'targetAudiences',
      currentAudiences.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="targetAudiences"
        render={() => (
          <FormItem>
            <FormLabel>
              Target Audiences{' '}
              <span className="text-neutral-500">
                {form.watch('targetAudiences')?.length || 0}/7
              </span>
            </FormLabel>
            <FormDescription>
              Enter your target audience groups to create relevant content.
              Better audience understanding improves results
            </FormDescription>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your target audience groups (e.g., Developers, Project Managers)"
                value={targetAudienceInput}
                onChange={(e) => setTargetAudienceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTargetAudience();
                  }
                }}
              />
              <Button type="button" onClick={addTargetAudience}>
                Add
              </Button>
            </div>

            {/* Display target audiences */}
            <div className="mt-4 flex flex-wrap gap-2">
              {form.watch('targetAudiences')?.map((audience, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <span>{audience}</span>
                  <button
                    type="button"
                    onClick={() => removeTargetAudience(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
