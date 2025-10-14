import PricingTable from '@workspace/ui/components/pricing-table';
import BrandCard from '@workspace/ui/components/brand-card';
import getSession from '@workspace/lib/get-session';
import prisma from '@workspace/db/prisma/client';
import { redirect } from 'next/navigation';

export default async function SubscribePage() {
  const session = await getSession();

  if (!session?.session) {
    redirect('/auth/signin');
  }

  // Type assertion to access activeProductId
  const sessionWithProductId = session.session as typeof session.session & {
    activeProductId?: string;
  };

  // Fetch the active product server-side
  let activeProduct = null;
  if (sessionWithProductId.activeProductId) {
    activeProduct = await prisma.product.findUnique({
      where: {
        id: sessionWithProductId.activeProductId,
      },
      include: {
        subscription: true,
      },
    });

    // If already subscribed, redirect to home
    const validStatuses = ['active', 'trialing'];
    if (
      activeProduct?.subscription?.status &&
      validStatuses.includes(activeProduct.subscription.status)
    ) {
      redirect('/');
    }
  }

  return (
    <div className="container mx-auto py-8 justify-center flex px-6">
      <div className="inline-flex flex-col">
        <div>
          <BrandCard />
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 text-left">
            Start your 3-day trial and unlock all features
          </p>
        </div>
        <PricingTable initialProduct={activeProduct} />
      </div>
    </div>
  );
}
