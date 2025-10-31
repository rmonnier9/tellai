'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import * as React from 'react';

type ArticleType = 'guide' | 'listicle';
type GuideSubtype = 'how_to' | 'explainer' | 'comparison' | 'reference';
type ListicleSubtype = 'round_up' | 'resources' | 'examples';
type ContentLength = 'short' | 'medium' | 'long' | 'comprehensive';

const CONTENT_LENGTH_OPTIONS: Array<{
  value: ContentLength;
  label: string;
  wordRange: string;
}> = [
  { value: 'short', label: 'Short', wordRange: '1,200-1,600 words' },
  { value: 'medium', label: 'Medium', wordRange: '1,600-2,400 words' },
  { value: 'long', label: 'Long', wordRange: '2,400-3,200 words' },
  {
    value: 'comprehensive',
    label: 'Comprehensive',
    wordRange: '3,200-4,200 words',
  },
];

const GUIDE_SUBTYPE_DESCRIPTIONS: Record<
  GuideSubtype,
  { label: string; description: string }
> = {
  how_to: {
    label: 'How-to',
    description:
      'Step-by-step instructional content that teaches readers how to accomplish a specific task or achieve a goal.',
  },
  explainer: {
    label: 'Explainer',
    description:
      'Educational content that breaks down complex concepts, ideas, or topics into understandable explanations.',
  },
  comparison: {
    label: 'Comparison',
    description:
      'Analytical articles that evaluate two or more options side-by-side. Provides detailed analysis to help readers make informed decisions.',
  },
  reference: {
    label: 'Reference',
    description:
      'Comprehensive reference material that serves as a go-to resource for information on a particular topic.',
  },
};

const LISTICLE_SUBTYPE_DESCRIPTIONS: Record<
  ListicleSubtype,
  { label: string; description: string }
> = {
  round_up: {
    label: 'Round-up',
    description:
      'Curated collections of tips, strategies, or advice organized in a list format for easy consumption.',
  },
  resources: {
    label: 'Resources',
    description:
      'Lists of tools, software, templates, or websites that help readers find useful resources.',
  },
  examples: {
    label: 'Examples',
    description:
      'Collections of case studies or real-world examples that illustrate concepts or best practices.',
  },
};

type ArticleSettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: {
    id: string;
    keyword: string;
    type: ArticleType | null;
    guideSubtype: GuideSubtype | null;
    listicleSubtype: ListicleSubtype | null;
    contentLength: ContentLength | null;
  };
  onSave: (data: {
    type: ArticleType | null;
    guideSubtype: GuideSubtype | null;
    listicleSubtype: ListicleSubtype | null;
    contentLength: ContentLength | null;
  }) => Promise<void>;
  isSaving?: boolean;
};

export function ArticleSettingsModal({
  open,
  onOpenChange,
  article,
  onSave,
  isSaving = false,
}: ArticleSettingsModalProps) {
  const [type, setType] = React.useState<ArticleType | null>(article.type);
  const [guideSubtype, setGuideSubtype] = React.useState<GuideSubtype | null>(
    article.guideSubtype
  );
  const [listicleSubtype, setListicleSubtype] =
    React.useState<ListicleSubtype | null>(article.listicleSubtype);
  const [contentLength, setContentLength] =
    React.useState<ContentLength | null>(article.contentLength);

  // Reset form when article changes or modal opens
  React.useEffect(() => {
    if (open) {
      setType(article.type);
      setGuideSubtype(article.guideSubtype);
      setListicleSubtype(article.listicleSubtype);
      setContentLength(article.contentLength);
    }
  }, [article, open]);

  const handleSave = async () => {
    await onSave({
      type,
      guideSubtype: type === 'guide' ? guideSubtype : null,
      listicleSubtype: type === 'listicle' ? listicleSubtype : null,
      contentLength,
    });
  };

  const handleClose = (open: boolean) => {
    if (!isSaving && !open) {
      // Reset to original values on cancel
      setType(article.type);
      setGuideSubtype(article.guideSubtype);
      setListicleSubtype(article.listicleSubtype);
      setContentLength(article.contentLength);
    }
    onOpenChange(open);
  };

  const currentSubtypeDescription =
    type === 'guide' && guideSubtype
      ? GUIDE_SUBTYPE_DESCRIPTIONS[guideSubtype]
      : type === 'listicle' && listicleSubtype
        ? LISTICLE_SUBTYPE_DESCRIPTIONS[listicleSubtype]
        : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Article Type Settings for '{article.keyword}'
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Article Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Article Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="articleType"
                  value="guide"
                  checked={type === 'guide'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setType('guide');
                      setListicleSubtype(null);
                    }
                  }}
                  className="h-4 w-4 text-primary focus:ring-primary"
                  disabled={isSaving}
                />
                <span className="text-sm">Guide</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="articleType"
                  value="listicle"
                  checked={type === 'listicle'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setType('listicle');
                      setGuideSubtype(null);
                    }
                  }}
                  className="h-4 w-4 text-primary focus:ring-primary"
                  disabled={isSaving}
                />
                <span className="text-sm">Listicle</span>
              </label>
            </div>
          </div>

          {/* Subtype */}
          {type && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Subtype</label>
              <Select
                value={
                  type === 'guide'
                    ? guideSubtype || undefined
                    : listicleSubtype || undefined
                }
                onValueChange={(value) => {
                  if (type === 'guide') {
                    setGuideSubtype(value as GuideSubtype);
                  } else {
                    setListicleSubtype(value as ListicleSubtype);
                  }
                }}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subtype" />
                </SelectTrigger>
                <SelectContent>
                  {type === 'guide' ? (
                    <>
                      <SelectItem value="how_to">
                        {GUIDE_SUBTYPE_DESCRIPTIONS.how_to.label}
                      </SelectItem>
                      <SelectItem value="explainer">
                        {GUIDE_SUBTYPE_DESCRIPTIONS.explainer.label}
                      </SelectItem>
                      <SelectItem value="comparison">
                        {GUIDE_SUBTYPE_DESCRIPTIONS.comparison.label}
                      </SelectItem>
                      <SelectItem value="reference">
                        {GUIDE_SUBTYPE_DESCRIPTIONS.reference.label}
                      </SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="round_up">
                        {LISTICLE_SUBTYPE_DESCRIPTIONS.round_up.label}
                      </SelectItem>
                      <SelectItem value="resources">
                        {LISTICLE_SUBTYPE_DESCRIPTIONS.resources.label}
                      </SelectItem>
                      <SelectItem value="examples">
                        {LISTICLE_SUBTYPE_DESCRIPTIONS.examples.label}
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              {/* Subtype Description */}
              {currentSubtypeDescription && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium mb-1">
                    {type === 'guide' ? 'Guide' : 'Listicle'}:{' '}
                    {currentSubtypeDescription.label}
                  </p>
                  <p className="text-muted-foreground">
                    {currentSubtypeDescription.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Content Length */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Content Length (Word Count)
            </label>
            <Select
              value={contentLength || undefined}
              onValueChange={(value) =>
                setContentLength(value as ContentLength)
              }
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select content length" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_LENGTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} ({option.wordRange})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ArticleSettingsModal;
