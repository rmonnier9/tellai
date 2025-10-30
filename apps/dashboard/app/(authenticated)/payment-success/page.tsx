'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { track } from '@workspace/lib/use-analytics';

export default function PaymentSuccessPage() {
  useEffect(() => {
    // Wait for Google Analytics to be ready before tracking
    const trackPurchase = async () => {
      // Wait a bit for GA to initialize
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Track the purchase event in Google Analytics
      track('purchase');
    };

    trackPurchase();
  }, []);

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-6 py-12">
      <Card className="w-full max-w-2xl border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-background">
        <CardHeader className="text-center space-y-4 pb-6">
          {/* Success Icon with Animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30 dark:bg-emerald-500/20" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">
              Payment Successful!
            </CardTitle>
            {/* <CardDescription className="text-base">
              Welcome to Lovarank Premium
            </CardDescription> */}
          </div>
        </CardHeader>

        <CardContent>
          {/* CTA Button */}
          <Button asChild size="lg" className="w-full">
            <Link href="/" className="group">
              Go to Dashboard
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
