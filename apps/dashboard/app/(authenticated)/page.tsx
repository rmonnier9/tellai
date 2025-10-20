import prisma from '@workspace/db/prisma/client';
import getSession from '@workspace/lib/get-session';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await getSession();

  if (!session?.session) {
    redirect('/auth/sign-in');
    return;
  }

  // Type assertion to access activeOrganizationId
  const sessionWithOrgId = session.session as typeof session.session & {
    activeOrganizationId?: string;
  };

  if (!sessionWithOrgId.activeOrganizationId) {
    redirect('/auth/sign-innnnn');
    return;
  }

  // Check if organization has any products
  const productsCount = await prisma.product.count({
    where: {
      organizationId: sessionWithOrgId.activeOrganizationId,
    },
  });

  // If no products, redirect to onboarding
  if (productsCount === 0) {
    redirect('/onboarding');
  }

  // Type assertion to access activeProductId
  const sessionWithProductId = session.session as typeof session.session & {
    activeProductId?: string;
  };

  // Get the active product to check subscription status
  if (sessionWithProductId.activeProductId) {
    const activeProduct = await prisma.product.findUnique({
      where: {
        id: sessionWithProductId.activeProductId,
      },
      include: {
        subscription: true,
      },
    });

    // Check if product has an active subscription (including trials)
    const validStatuses = ['active', 'trialing', 'past_due'];
    if (
      !activeProduct?.subscription ||
      !activeProduct.subscription.status ||
      !validStatuses.includes(activeProduct.subscription.status)
    ) {
      redirect('/subscribe');
    }
  } else {
    // If no active product is set, redirect to subscribe
    redirect('/subscribe');
  }

  // If everything is good, redirect to calendar
  redirect('/calendar');
}
