import PricingTable from '@workspace/ui/components/pricing-table';
import LogoIcon from '@workspace/ui/components/logo-icon';

export default function SubscribePage() {
  return (
    <div className="container mx-auto py-8 justify-center flex px-6">
      <div className="inline-flex flex-col">
        <div className="text-left">
          <LogoIcon className="mb-2 -ml-2" />
          <h1 className="text-3xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 font-display">
            The AI Agent that Grows
            <br />
            Your Organic Traffic
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Start your 3-day trial and unlock all features
          </p>
        </div>
        <PricingTable />
      </div>
    </div>
  );
}
