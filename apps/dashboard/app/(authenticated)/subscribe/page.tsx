import PricingTable from '@workspace/ui/components/pricing-table';
import LogoIcon from '@workspace/ui/components/logo-icon';
import BrandCard from '@workspace/ui/components/brand-card';

export default function SubscribePage() {
  return (
    <div className="container mx-auto py-8 justify-center flex px-6">
      <div className="inline-flex flex-col">
        <div>
          <BrandCard />
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 text-left">
            Start your 3-day trial and unlock all features
          </p>
        </div>
        <PricingTable />
      </div>
    </div>
  );
}
