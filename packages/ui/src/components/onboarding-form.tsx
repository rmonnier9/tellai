'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@workspace/ui/components/button';
import { Card } from '@workspace/ui/components/card';
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

import { OnboardingProductSchema } from '@workspace/lib/dtos';
import { analyzeBusinessUrl } from '@workspace/lib/server-actions/analyze-business-url';
import { completeOnboardingAndRedirect } from '@workspace/lib/server-actions/complete-onboarding';
import { ProductArticlePreferencesForm } from '@workspace/ui/components/product-article-preferences-form';
import { ProductBlogContentForm } from '@workspace/ui/components/product-blog-content-form';
import { ProductBusinessInfoForm } from '@workspace/ui/components/product-business-info-form';
import { ProductTargetAudienceForm } from '@workspace/ui/components/product-target-audience-form';

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
      competitors: [],
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
    let url = form.getValues('url').trim();

    // Add https:// if no protocol is present
    if (url && !url.match(/^https?:\/\//i)) {
      url = `https://${url}`;
      form.setValue('url', url);
    }

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

        // Set competitors and sitemapUrl if available (type assertion for now)
        const resultWithExtras = result.result as typeof result.result & {
          sitemapUrl?: string;
          competitors?: string[];
        };
        form.setValue('sitemapUrl', resultWithExtras.sitemapUrl || '');
        form.setValue('competitors', resultWithExtras.competitors || []);

        // Clear any validation errors for the fields we just populated
        form.clearErrors([
          'name',
          'description',
          'language',
          'country',
          'logo',
          'targetAudiences',
          'competitors',
          'sitemapUrl',
        ]);

        toast.success('Website analyzed successfully', {
          description: "We've pre-filled your business information",
        });

        setCurrentStep(2);
      } else if (result.status === 'failed') {
        const errorMessage =
          result.error?.message || 'Failed to analyze website';

        // Set form error
        form.setError('url', {
          message: errorMessage,
        });

        // Show toast notification for better visibility
        toast.error('Analysis failed', {
          description: errorMessage,
        });
      } else {
        const errorMessage =
          'Unable to analyze website. Please ensure the URL is correct and the website is accessible.';

        form.setError('url', {
          message: errorMessage,
        });

        toast.error('Analysis failed', {
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('Error analyzing URL:', error);

      // Determine error message based on error type
      let errorMessage = 'Failed to analyze website. Please try again.';

      if (error instanceof Error) {
        // Check for network errors
        if (
          error.message.includes('fetch') ||
          error.message.includes('network')
        ) {
          errorMessage =
            'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage =
            'Request timed out. The website might be slow to respond.';
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      form.setError('url', {
        message: errorMessage,
      });

      toast.error('Analysis failed', {
        description: errorMessage,
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

  const handleAudienceNext = async () => {
    const fieldsToValidate: (keyof z.infer<typeof OnboardingProductSchema>)[] =
      ['targetAudiences', 'competitors'];
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      setCurrentStep(4);
    }
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
      // Next.js throws NEXT_REDIRECT error to handle redirects in server actions
      // We need to re-throw it so the redirect can complete
      if (isRedirectError(error)) {
        throw error;
      }

      console.error('Error submitting onboarding:', error);
      toast.error('An error occurred', {
        description: 'Please try again later.',
      });
      setIsSubmitting(false);
    }
  };

  // Get current step details
  const currentStepInfo = steps.find((step) => step.id === currentStep);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-8 py-8 pb-32">
        {/* Previous Step Progress - Commented Out */}
        {/* <nav aria-label="Progress" className="px-4">
          <ol role="list" className="flex items-center justify-between">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className="relative flex flex-1 items-center">
                {stepIdx !== 0 && (
                  <div className="absolute right-1/2 top-5 -z-10 w-full">
                    <div className="h-0.5 w-full bg-border">
                      <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{
                          width: currentStep > step.id ? '100%' : '0%',
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex w-full flex-col items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`
                        relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 
                        transition-all duration-300 ease-out
                        ${
                          currentStep === step.id
                            ? 'border-primary bg-primary shadow-lg shadow-primary/30 scale-110'
                            : currentStep > step.id
                              ? 'border-primary bg-primary'
                              : 'border-border bg-background'
                        }
                      `}
                    >
                      {currentStep > step.id && (
                        <Check className="h-5 w-5 text-primary-foreground animate-in zoom-in-50 duration-300" />
                      )}
                      {currentStep <= step.id && (
                        <span
                          className={`
                            text-sm font-semibold transition-colors duration-300
                            ${
                              currentStep === step.id
                                ? 'text-primary-foreground'
                                : 'text-muted-foreground'
                            }
                          `}
                        >
                          {step.id}
                        </span>
                      )}
                    </div>
                    {currentStep === step.id && (
                      <div className="absolute inset-0 -z-10 animate-pulse">
                        <div className="h-full w-full rounded-full bg-primary/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <span
                      className={`
                        text-xs font-medium transition-all duration-300 text-center
                        ${
                          currentStep === step.id
                            ? 'text-foreground scale-105'
                            : currentStep > step.id
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                        }
                      `}
                    >
                      {step.name}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </nav> */}

        {/* New Circular Step Progress */}
        <nav aria-label="Progress" className="px-4">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
            <div>
              <span className="text-5xl md:text-8xl font-bold font-display">
                {currentStep}
              </span>
            </div>

            {/* Step Information */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {currentStepInfo?.name}
              </h3>
              <p className="text-sm text-muted-foreground sm:text-base">
                {currentStep === 1 &&
                  "We'll analyze your website to pre-fill your business information"}
                {currentStep === 2 &&
                  'Based on your website, verify and complete your business details'}
                {currentStep === 3 &&
                  'Understanding your audience ensures we generate the most effective keywords'}
                {currentStep === 4 &&
                  'Share your content details to help us create relevant blog posts'}
                {currentStep === 5 &&
                  'Set your preferences to ensure all articles maintain your quality standards'}
              </p>

              {/* Step Indicators */}
              <div className="flex items-center justify-center gap-2 pt-2 sm:justify-start">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`
                      h-1.5 rounded-full transition-all duration-500
                      ${
                        step.id === currentStep
                          ? 'w-8 bg-primary'
                          : step.id < currentStep
                            ? 'w-6 bg-primary/60'
                            : 'w-4 bg-muted'
                      }
                    `}
                    aria-label={`Step ${step.id}: ${step.name}${step.id === currentStep ? ' (current)' : step.id < currentStep ? ' (completed)' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
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
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUrlSubmit();
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the URL of your business or product website
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

                  <ProductBusinessInfoForm form={form} />
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

                  <ProductTargetAudienceForm form={form} />
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

                  <ProductBlogContentForm form={form} />
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

                  <ProductArticlePreferencesForm form={form} />
                </div>
              </Card>
            )}
          </form>
        </Form>
      </div>

      {/* Fixed Footer with Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-4xl px-4 py-4">
          <div className="flex justify-between">
            {/* Back Button */}
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((currentStep - 1) as StepId)}
                disabled={isAnalyzing || isSubmitting}
              >
                Back
              </Button>
            )}
            {currentStep === 1 && <div />}

            {/* Continue/Submit Button */}
            {currentStep === 1 && (
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
            )}
            {currentStep === 2 && (
              <Button type="button" onClick={handleBusinessInfoNext}>
                Continue
              </Button>
            )}
            {currentStep === 3 && (
              <Button type="button" onClick={handleAudienceNext}>
                Continue
              </Button>
            )}
            {currentStep === 4 && (
              <Button type="button" onClick={handleBlogNext}>
                Continue
              </Button>
            )}
            {currentStep === 5 && (
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Complete'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingForm;
