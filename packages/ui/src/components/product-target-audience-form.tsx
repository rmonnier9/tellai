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

// Helper function to convert input to full URL
function normalizeToUrl(input: string): string {
  let url = input.trim();

  // Add protocol if missing
  if (!url.match(/^https?:\/\//i)) {
    url = `https://${url}`;
  }

  try {
    const urlObj = new URL(url);
    // Return the full URL with protocol and hostname (remove www)
    let hostname = urlObj.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return `${urlObj.protocol}//${hostname}`;
  } catch {
    // If URL parsing fails, try to construct it manually
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^/\s]+)/i);
    if (match && match[1]) {
      return `https://${match[1]}`;
    }
    return `https://${input.trim()}`;
  }
}

// Helper function to extract domain for display from full URL
function extractDomainForDisplay(url: string): string {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname;

    // Remove www. prefix if present
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }

    return domain;
  } catch {
    // Fallback: try to extract domain manually
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^/\s]+)/i);
    if (match && match[1]) {
      let domain = match[1];
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      return domain;
    }
    return url;
  }
}

export function ProductTargetAudienceForm({
  form,
}: ProductTargetAudienceFormProps) {
  const [targetAudienceInput, setTargetAudienceInput] = useState('');
  const [competitorInput, setCompetitorInput] = useState('');

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
      currentAudiences.filter((_: string, i: number) => i !== index)
    );
  };

  const addCompetitor = () => {
    if (competitorInput.trim()) {
      const currentCompetitors = form.getValues('competitors') || [];

      // Check if we've reached the max limit
      if (currentCompetitors.length >= 7) {
        return;
      }

      const fullUrl = normalizeToUrl(competitorInput);

      // Check if this competitor already exists
      if (currentCompetitors.includes(fullUrl)) {
        setCompetitorInput('');
        return;
      }

      form.setValue('competitors', [...currentCompetitors, fullUrl]);
      setCompetitorInput('');
    }
  };

  const removeCompetitor = (index: number) => {
    const currentCompetitors = form.getValues('competitors') || [];
    form.setValue(
      'competitors',
      currentCompetitors.filter((_: string, i: number) => i !== index)
    );
  };

  return (
    <div className="space-y-8">
      {/* Target Audiences Section */}
      <FormField
        control={form.control}
        name="targetAudiences"
        render={() => (
          <FormItem>
            <FormLabel>
              Target Audiences{' '}
              <span className="text-muted-foreground">
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
              {form
                .watch('targetAudiences')
                ?.map((audience: string, index: number) => (
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

      {/* Competitors Section */}
      <FormField
        control={form.control}
        name="competitors"
        render={() => (
          <FormItem>
            <FormLabel>
              Competitors{' '}
              <span className="text-muted-foreground">
                {form.watch('competitors')?.length || 0}/7
              </span>
            </FormLabel>
            <FormDescription>
              Enter competitors to discover the SEO keywords they rank for.
              Bigger competitors provide more valuable insights
            </FormDescription>
            <div className="flex gap-2">
              <Input
                placeholder="Enter competitor URLs or company names (e.g. https://chaindesk.ai or chaindesk.ai)"
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCompetitor();
                  }
                }}
                disabled={(form.watch('competitors')?.length || 0) >= 7}
              />
              <Button
                type="button"
                onClick={addCompetitor}
                disabled={(form.watch('competitors')?.length || 0) >= 7}
              >
                Add
              </Button>
            </div>

            {/* Display competitors */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {form.watch('competitors')?.map((url: string, index: number) => {
                const displayDomain = extractDomainForDisplay(url);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-input bg-background px-4 py-3"
                  >
                    {/* Favicon */}
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${displayDomain}&sz=128`}
                        alt={`${displayDomain} favicon`}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          // Fallback to first letter if favicon fails
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove(
                            'hidden'
                          );
                        }}
                      />
                      <div className="hidden h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                        {displayDomain.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Domain */}
                    <span className="flex-1 text-sm">{displayDomain}</span>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeCompetitor(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
