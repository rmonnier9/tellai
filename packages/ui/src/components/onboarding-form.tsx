'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, X, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@workspace/ui/components/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Card } from '@workspace/ui/components/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';

import { OnboardingProductSchema } from '@workspace/lib/dtos';
import { analyzeBusinessUrl } from '@workspace/lib/server-actions/analyze-business-url';
import { completeOnboardingAndRedirect } from '@workspace/lib/server-actions/complete-onboarding';

const steps = [
  { id: 1, name: 'Website', status: 'current' },
  { id: 2, name: 'Business Info', status: 'upcoming' },
  { id: 3, name: 'Audience & Competitors', status: 'upcoming' },
  { id: 4, name: 'Blog', status: 'upcoming' },
  { id: 5, name: 'Articles', status: 'upcoming' },
] as const;

type StepId = (typeof steps)[number]['id'];

export function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetAudienceInput, setTargetAudienceInput] = useState('');
  const [bestArticleInput, setBestArticleInput] = useState('');

  const form = useForm<z.infer<typeof OnboardingProductSchema>>({
    resolver: zodResolver(OnboardingProductSchema),
    defaultValues: {
      url: '',
      name: '',
      description: '',
      language: '',
      country: '',
      logo: '',
      targetAudiences: [],
      sitemapUrl: '',
      blogUrl: '',
      bestArticles: [],
      autoPublish: true,
      articleStyle: 'informative',
      internalLinks: 3,
      globalInstructions: '',
      imageStyle: 'brand-text',
      brandColor: '#000000',
      includeYoutubeVideo: true,
      includeCallToAction: true,
      includeInfographics: true,
      includeEmojis: true,
    },
  });

  const handleUrlSubmit = async () => {
    const url = form.getValues('url');
    const urlValidation = await form.trigger('url');

    if (!urlValidation) return;

    setIsAnalyzing(true);

    try {
      const result = await analyzeBusinessUrl(url);

      // Populate form with analysis results
      if (result.status === 'success') {
        form.setValue('name', result.result.name || '');
        form.setValue('description', result.result.description || '');
        form.setValue('language', result.result.language || '');
        form.setValue('country', result.result.country || '');
        form.setValue('logo', result.result.logo || '');
        form.setValue('targetAudiences', result.result.targetAudiences || []);
        // Set sitemapUrl if available (type assertion for now)
        const resultWithSitemap = result.result as typeof result.result & {
          sitemapUrl?: string;
        };
        form.setValue('sitemapUrl', resultWithSitemap.sitemapUrl || '');
        setCurrentStep(2);
      } else if (result.status === 'failed') {
        throw new Error(result.error?.message || 'Failed to analyze website');
      } else {
        throw new Error('Failed to analyze website');
      }
    } catch (error) {
      console.error('Error analyzing URL:', error);
      form.setError('url', {
        message: 'Failed to analyze website. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBusinessInfoNext = async () => {
    const fieldsToValidate: (keyof z.infer<typeof OnboardingProductSchema>)[] =
      ['name', 'description', 'language', 'country'];
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      setCurrentStep(3);
    }
  };

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

  const handleAudienceNext = async () => {
    const fieldsToValidate: (keyof z.infer<typeof OnboardingProductSchema>)[] =
      ['targetAudiences'];
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      setCurrentStep(4);
    }
  };

  const addBestArticle = () => {
    if (bestArticleInput.trim()) {
      const currentArticles = form.getValues('bestArticles') || [];
      if (currentArticles.length < 3) {
        form.setValue('bestArticles', [
          ...currentArticles,
          bestArticleInput.trim(),
        ]);
        setBestArticleInput('');
      }
    }
  };

  const removeBestArticle = (index: number) => {
    const currentArticles = form.getValues('bestArticles') || [];
    form.setValue(
      'bestArticles',
      currentArticles.filter((_, i) => i !== index)
    );
  };

  const handleBlogNext = async () => {
    // Blog fields are optional, so we can proceed to next step
    setCurrentStep(5);
  };

  const onSubmit = async (data: z.infer<typeof OnboardingProductSchema>) => {
    setIsSubmitting(true);

    try {
      toast.success('Saving your onboarding data...', {
        description: 'Please wait while we set everything up.',
      });

      // This will save the data and redirect to home page
      await completeOnboardingAndRedirect(data);
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      toast.error('An error occurred', {
        description: 'Please try again later.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-8">
      {/* Step Progress */}
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center justify-center space-x-5">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className="flex items-center">
              {stepIdx > 0 && (
                <div className="mr-5 h-0.5 w-16 bg-neutral-200" />
              )}
              <div
                className={`flex items-center rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap ${
                  currentStep === step.id
                    ? 'bg-violet-600 text-white'
                    : currentStep > step.id
                      ? 'bg-violet-100 text-violet-600'
                      : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                <span className="mr-2">{step.id}</span>
                <span className="whitespace-nowrap">{step.name}</span>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Form Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Website URL */}
          {currentStep === 1 && (
            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Enter your website URL
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    We'll analyze your website to pre-fill your business
                    information
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          type="url"
                          {...field}
                          disabled={isAnalyzing}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the URL of your business or product website
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleUrlSubmit}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Business Information */}
          {currentStep === 2 && (
            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">
                    About your business
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Based on your website, we've populated the following
                    information. Please verify and complete as needed
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business name</FormLabel>
                      <FormControl>
                        <Input placeholder="SiteGPT" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex w-full gap-2">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Language</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="it">Italian</SelectItem>
                            <SelectItem value="pt">Portuguese</SelectItem>
                            <SelectItem value="nl">Dutch</SelectItem>
                            <SelectItem value="pl">Polish</SelectItem>
                            <SelectItem value="ru">Russian</SelectItem>
                            <SelectItem value="ja">Japanese</SelectItem>
                            <SelectItem value="ko">Korean</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                            <SelectItem value="hi">Hindi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Country</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="DE">Germany</SelectItem>
                            <SelectItem value="FR">France</SelectItem>
                            <SelectItem value="ES">Spain</SelectItem>
                            <SelectItem value="IT">Italy</SelectItem>
                            <SelectItem value="NL">Netherlands</SelectItem>
                            <SelectItem value="SE">Sweden</SelectItem>
                            <SelectItem value="NO">Norway</SelectItem>
                            <SelectItem value="DK">Denmark</SelectItem>
                            <SelectItem value="FI">Finland</SelectItem>
                            <SelectItem value="PL">Poland</SelectItem>
                            <SelectItem value="BR">Brazil</SelectItem>
                            <SelectItem value="MX">Mexico</SelectItem>
                            <SelectItem value="AR">Argentina</SelectItem>
                            <SelectItem value="JP">Japan</SelectItem>
                            <SelectItem value="KR">South Korea</SelectItem>
                            <SelectItem value="CN">China</SelectItem>
                            <SelectItem value="IN">India</SelectItem>
                            <SelectItem value="SG">Singapore</SelectItem>
                            <SelectItem value="NZ">New Zealand</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <textarea
                          className="placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Describe what your business does..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={handleBusinessInfoNext}>
                    Continue
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Target Audiences & Competitors */}
          {currentStep === 3 && (
            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Define your Target Audience
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Understanding your audience ensures we generate the most
                    effective keywords
                  </p>
                </div>

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
                        Enter your target audience groups to create relevant
                        content. Better audience understanding improves results
                      </FormDescription>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter your target audience groups (e.g., Developers, Project Managers)"
                          value={targetAudienceInput}
                          onChange={(e) =>
                            setTargetAudienceInput(e.target.value)
                          }
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
                          ?.map((audience, index) => (
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

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={handleAudienceNext}>
                    Continue
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 4: Blog Content */}
          {currentStep === 4 && (
            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Help us understand your content
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Share your content details to help us create more relevant
                    and targeted blog posts for your audience
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="sitemapUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sitemap URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.sitegpt.ai/sitemap.xml"
                          type="url"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="blogUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main blog address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://yourblog.com/blog"
                          type="url"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bestArticles"
                  render={() => (
                    <FormItem>
                      <FormLabel>Your best article examples URL</FormLabel>
                      <FormDescription>
                        Add up to 3 URLs of your best articles to help us
                        understand your content style
                      </FormDescription>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Your top article URL #1"
                          value={bestArticleInput}
                          onChange={(e) => setBestArticleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addBestArticle();
                            }
                          }}
                          disabled={
                            (form.watch('bestArticles')?.length || 0) >= 3
                          }
                        />
                        <Button
                          type="button"
                          onClick={addBestArticle}
                          disabled={
                            (form.watch('bestArticles')?.length || 0) >= 3
                          }
                        >
                          Add
                        </Button>
                      </div>

                      {/* Display best articles */}
                      <div className="mt-4 space-y-2">
                        {form.watch('bestArticles')?.map((article, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                          >
                            <span className="flex-1 truncate">{article}</span>
                            <button
                              type="button"
                              onClick={() => removeBestArticle(index)}
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

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={handleBlogNext}>
                    Continue
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 5: Article Preferences */}
          {currentStep === 5 && (
            <Card className="p-8">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Configure your article preferences
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Set your preferences once to ensure all future articles
                    maintain your quality standards and brand consistency
                  </p>
                </div>

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
                          <FormLabel className="text-base">
                            Auto-publish
                          </FormLabel>
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
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="informative">
                                Informative
                              </SelectItem>
                              <SelectItem value="narrative">
                                Narrative
                              </SelectItem>
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
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select links" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">No links</SelectItem>
                              <SelectItem value="1">
                                1 link per article
                              </SelectItem>
                              <SelectItem value="2">
                                2 links per article
                              </SelectItem>
                              <SelectItem value="3">
                                3 links per article
                              </SelectItem>
                              <SelectItem value="5">
                                5 links per article
                              </SelectItem>
                              <SelectItem value="7">
                                7 links per article
                              </SelectItem>
                              <SelectItem value="10">
                                10 links per article
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="text-sm text-primary">
                    Finetune with your articles
                  </div>

                  {/* Global Instructions */}
                  <FormField
                    control={form.control}
                    name="globalInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Global Article Instructions</FormLabel>
                          <Info className="h-4 w-4 text-muted-foreground" />
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
                                className={`relative rounded-lg border-2 p-2 transition-all ${
                                  field.value === style.value
                                    ? 'border-violet-600 bg-violet-600/10 ring-2 ring-violet-600/20'
                                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                                }`}
                              >
                                <div className="aspect-video rounded bg-neutral-100 mb-2 flex items-center justify-center">
                                  <span className="text-xs text-neutral-400">
                                    {style.label}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className={`text-xs font-medium ${
                                      field.value === style.value
                                        ? 'text-violet-600'
                                        : ''
                                    }`}
                                  >
                                    {style.label}
                                  </span>
                                  <Info className="h-3 w-3 text-muted-foreground" />
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
                            <Input
                              placeholder="#000000"
                              {...field}
                              className="flex-1"
                            />
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
                            Automatically finds and adds relevant YouTube videos
                            based on article content.
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
                            Automatically adds a call-to-action section with
                            your website URL to drive engagement.
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
                            Automatically replaces images with data
                            visualizations when articles contain statistics or
                            comparisons.
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
                            Automatically adds relevant emojis to enhance
                            engagement and visual appeal.
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

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}

export default OnboardingForm;
