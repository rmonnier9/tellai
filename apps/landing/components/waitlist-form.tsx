'use client';

import { submitWaitlist } from '@/actions/submit-waitlist';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useState } from 'react';
import { toast } from '@workspace/ui/components/sonner';

export default function WaitlistForm() {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <form
      className="flex lg:flex-row flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          setIsLoading(true);
          const formData = new FormData(e.target as HTMLFormElement);
          const email = formData.get('email') as string;
          console.log(email);
          await submitWaitlist(email);
          toast.success('You are on the waitlist!');
          (e.target as HTMLFormElement).reset();
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }}
    >
      <Input
        name="email"
        className="bg-white lg:!text-2xl lg:p-8 rounded-2xl"
        type="email"
        placeholder="Email"
        disabled={isLoading}
      />
      <Button
        className="lg:text-xl lg:p-8 rounded-2xl"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? 'Joining...' : 'Join the waitlist'}
      </Button>
    </form>
  );
}
