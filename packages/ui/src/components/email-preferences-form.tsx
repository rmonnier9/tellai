'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getUserEmailPreferences } from '@workspace/lib/server-actions/get-user-email-preferences';
import { updateUserEmailPreferences } from '@workspace/lib/server-actions/update-user-email-preferences';
import { Button } from '@workspace/ui/components/button';
import { Card } from '@workspace/ui/components/card';
import { Switch } from '@workspace/ui/components/switch';

export function EmailPreferencesForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [
    emailNotificationsContentPlanner,
    setEmailNotificationsContentPlanner,
  ] = useState(true);
  const [
    emailNotificationsArticleGenerated,
    setEmailNotificationsArticleGenerated,
  ] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const result = await getUserEmailPreferences();
        if (result.success && result.preferences) {
          setEmailNotificationsContentPlanner(
            result.preferences.emailNotificationsContentPlanner
          );
          setEmailNotificationsArticleGenerated(
            result.preferences.emailNotificationsArticleGenerated
          );
        } else {
          toast.error('Failed to load email preferences', {
            description: result.error || 'Please try again later.',
          });
        }
      } catch (error) {
        console.error('Error loading email preferences:', error);
        toast.error('An error occurred', {
          description: 'Please try again later.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const result = await updateUserEmailPreferences({
        emailNotificationsContentPlanner,
        emailNotificationsArticleGenerated,
      });

      if (result.success) {
        toast.success('Email preferences saved successfully', {
          description: 'Your email notification preferences have been updated.',
        });
      } else {
        toast.error('Failed to save email preferences', {
          description: result.error || 'Please try again later.',
        });
      }
    } catch (error) {
      console.error('Error saving email preferences:', error);
      toast.error('An error occurred', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Email Preferences</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your email notification preferences for transactional emails
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Content Planner Notification */}
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <label className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Content Planner Ready Notifications
              </label>
              <p className="text-sm text-muted-foreground">
                Receive an email notification when your content planner has been
                generated with new article ideas.
              </p>
            </div>
            <Switch
              checked={emailNotificationsContentPlanner}
              onCheckedChange={setEmailNotificationsContentPlanner}
            />
          </div>

          {/* Article Generated Notification */}
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <label className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Article Generated Notifications
              </label>
              <p className="text-sm text-muted-foreground">
                Receive an email notification when a new blog post has been
                generated and is ready for review.
              </p>
            </div>
            <Switch
              checked={emailNotificationsArticleGenerated}
              onCheckedChange={setEmailNotificationsArticleGenerated}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Preferences
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
