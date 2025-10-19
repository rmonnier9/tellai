import { OnboardingForm } from '@workspace/ui/components/onboarding-form';

export const metadata = {
  title: 'Onboarding',
};

export default function OnboardingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OnboardingForm />
    </div>
  );
}
