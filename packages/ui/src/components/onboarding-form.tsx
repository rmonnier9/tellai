'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, X } from 'lucide-react';
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

import { OnboardingProductSchema } from '@workspace/lib/dtos';
import { analyzeBusinessUrl } from '@workspace/lib/server-actions/analyze-business-url';
import { completeOnboardingAndRedirect } from '@workspace/lib/server-actions/complete-onboarding';

const steps = [
  { id: 1, name: 'Website', status: 'current' },
  { id: 2, name: 'Business Info', status: 'upcoming' },
  { id: 3, name: 'Audience & Competitors', status: 'upcoming' },
] as const;

type StepId = (typeof steps)[number]['id'];

export function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetAudienceInput, setTargetAudienceInput] = useState('');

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
                className={`flex items-center rounded-full px-4 py-2 text-sm font-medium ${
                  currentStep === step.id
                    ? 'bg-violet-600 text-white'
                    : currentStep > step.id
                      ? 'bg-violet-100 text-violet-600'
                      : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                <span className="mr-2">{step.id}</span>
                <span>{step.name}</span>
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

          {/* Step 3: Target Audiences */}
          {currentStep === 3 && (
            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Define your Target Audience and Competitors
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Understanding your audience and competition ensures we
                    generate the most effective keywords
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
