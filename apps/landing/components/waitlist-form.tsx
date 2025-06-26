'use client';

import { submitWaitlist } from '@/actions/submit-waitlist';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { useState } from 'react';
import { toast } from '@workspace/ui/components/sonner';

export default function WaitlistForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  return (
    <form
      className="flex flex-row gap-2 sm:gap-4 w-full max-w-xl"
      onSubmit={async (e) => {
        e.preventDefault();
        if (email.length === 0) {
          return;
        }
        try {
          setIsLoading(true);
          const formData = new FormData(e.target as HTMLFormElement);
          const email = formData.get('email') as string;
          console.log(email);
          await submitWaitlist(email);
          toast.success('You are on the waitlist!', {
            position: 'top-center',
          });
          (e.target as HTMLFormElement).reset();
          setEmail('');
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }}
    >
      <Input
        name="email"
        className="bg-white text-xl p-6 sm:!text-2xl sm:p-8 rounded-2xl flex-1"
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button
        className="text-lg p-6 sm:text-xl sm:p-8 rounded-2xl"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? 'Joining...' : 'Join the waitlist'}
      </Button>
    </form>
  );
}
