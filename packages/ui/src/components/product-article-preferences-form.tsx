'use client';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { Info } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface ProductArticlePreferencesFormProps {
  form: UseFormReturn<any>;
}

export function ProductArticlePreferencesForm({
  form,
}: ProductArticlePreferencesFormProps) {
  return (
    <div className="space-y-8">
      {/* Content & SEO Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Content & SEO</h3>

        {/* Auto-publish */}
        <FormField
          control={form.control}
          name="autoPublish"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Auto-publish</FormLabel>
                <FormDescription>
                  Publish new articles automatically
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          {/* Article Style */}
          <FormField
            control={form.control}
            name="articleStyle"
            render={({ field }) => (
              <FormItem className="flex-1">
                <div className="flex items-center gap-2">
                  <FormLabel>Article Style</FormLabel>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Define the writing style and tone for your content. This
                        can be automatically derived from your example articles
                        for more consistent branding.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="informative">Informative</SelectItem>
                    <SelectItem value="narrative">Narrative</SelectItem>
                    <SelectItem value="listicle">Listicle</SelectItem>
                    <SelectItem value="howto">How-to</SelectItem>
                    <SelectItem value="opinion">Opinion</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Internal Links */}
          <FormField
            control={form.control}
            name="internalLinks"
            render={({ field }) => (
              <FormItem className="flex-1">
                <div className="flex items-center gap-2">
                  <FormLabel>Internal Links</FormLabel>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Select how many internal links to include from your
                        blog's sitemap. Links will be automatically selected
                        based on content relevance to improve SEO and user
                        engagement.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select links" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">No links</SelectItem>
                    <SelectItem value="1">1 link per article</SelectItem>
                    <SelectItem value="2">2 links per article</SelectItem>
                    <SelectItem value="3">3 links per article</SelectItem>
                    <SelectItem value="5">5 links per article</SelectItem>
                    <SelectItem value="7">7 links per article</SelectItem>
                    <SelectItem value="10">10 links per article</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="text-sm text-primary">Finetune with your articles</div>

        {/* Global Instructions */}
        <FormField
          control={form.control}
          name="globalInstructions"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel>Global Article Instructions</FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Define any global instructions for your articles.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <FormControl>
                <textarea
                  className="placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex min-h-[100px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter global instructions for all articles (e.g., 'Always include practical examples', 'Focus on actionable insights')..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Engagement Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Engagement</h3>

        {/* Image Style */}
        <FormField
          control={form.control}
          name="imageStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image Style</FormLabel>
              <FormControl>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { value: 'brand-text', label: 'Brand & Text' },
                    { value: 'watercolor', label: 'Watercolor' },
                    { value: 'cinematic', label: 'Cinematic' },
                    { value: 'illustration', label: 'Illustration' },
                    { value: 'sketch', label: 'Sketch' },
                  ].map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => field.onChange(style.value)}
                      // className={`relative rounded-lg border-2 p-2 transition-all ${
                      //   field.value === style.value
                      //     ? 'border-violet-600 bg-violet-600/10 ring-2 ring-violet-600/20'
                      //     : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      // }`}
                      className={cn(
                        `relative rounded-lg border-2 p-2 transition-all cursor-pointer`,
                        {
                          'border-pink-600 bg-pink-600/10 ring-2 ring-pink-600/20':
                            field.value === style.value,
                          'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/30':
                            field.value !== style.value,
                        }
                      )}
                    >
                      <div className="aspect-[4/5] rounded bg-neutral-100 mb-2 overflow-hidden">
                        <img
                          src={`/images/example-${style.value}.jpeg`}
                          alt={`Example ${style.label} style`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-medium ${
                            field.value === style.value ? 'text-pink-600' : ''
                          }`}
                        >
                          {style.label}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {style.value === 'brand-text' &&
                                'Photo-realistic scenes with text matching your article content and background using your brand color.'}
                              {style.value === 'watercolor' &&
                                'Photo-realistic scenes with artistic watercolor effects, creating a soft and elegant look.'}
                              {style.value === 'cinematic' &&
                                'High-quality, dramatic photos with cinematic lighting and composition.'}
                              {style.value === 'illustration' &&
                                'Modern digital illustrations with clean lines and vibrant colors.'}
                              {style.value === 'sketch' &&
                                'Hand-drawn pencil sketch style with natural textures and shading.'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Brand Color */}
        <FormField
          control={form.control}
          name="brandColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand Color</FormLabel>
              <div className="flex gap-2">
                <div
                  className="h-10 w-10 rounded-md border border-neutral-200 cursor-pointer"
                  style={{ backgroundColor: field.value }}
                  onClick={() => {
                    const input = document.getElementById(
                      'colorInput'
                    ) as HTMLInputElement;
                    input?.click();
                  }}
                />
                <FormControl>
                  <Input placeholder="#000000" {...field} className="flex-1" />
                </FormControl>
                <input
                  id="colorInput"
                  type="color"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="sr-only"
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* YouTube Video Toggle */}
        <FormField
          control={form.control}
          name="includeYoutubeVideo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>YouTube Video</FormLabel>
                <FormDescription>
                  Automatically finds and adds relevant YouTube videos based on
                  article content.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Call-to-Action Toggle */}
        <FormField
          control={form.control}
          name="includeCallToAction"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Call-to-Action</FormLabel>
                <FormDescription>
                  Automatically adds a call-to-action section with your website
                  URL to drive engagement.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Infographics Toggle */}
        <FormField
          control={form.control}
          name="includeInfographics"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Include Infographics</FormLabel>
                <FormDescription>
                  Automatically replaces images with data visualizations when
                  articles contain statistics or comparisons.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Emojis Toggle */}
        <FormField
          control={form.control}
          name="includeEmojis"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Include Emojis</FormLabel>
                <FormDescription>
                  Automatically adds relevant emojis to enhance engagement and
                  visual appeal.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
