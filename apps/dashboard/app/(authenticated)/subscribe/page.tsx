import prisma from '@workspace/db/prisma/client';
import getSession from '@workspace/lib/get-session';
import BrandCard from '@workspace/ui/components/brand-card';
import PricingTable from '@workspace/ui/components/pricing-table';
import { TestimonialsCarousel } from '@workspace/ui/components/testimonials-carousel';
import { redirect } from 'next/navigation';
import { testimonials } from '@workspace/lib/data/testimonials';

export const metadata = {
  title: 'Subscribe',
};

export default async function SubscribePage() {
  const session = await getSession();

  if (!session?.session) {
    redirect('/auth/sign-in');
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
    <div className="container mx-auto flex flex-col px-6 py-8">
      {/* Main content - Pricing */}
      <div className="flex justify-center">
        <div className="inline-flex flex-col">
          <div>
            <BrandCard />

            {/* <p className="mt-4 text-left text-lg text-muted-foreground">
              Start your 3-day trial and unlock all features
            </p> */}
          </div>
          <PricingTable initialProduct={activeProduct} />
        </div>
      </div>

      {/* Top section with social proof */}
      <div className="relative mt-8 mx-auto">
        <div className="flex flex-col gap-4">
          <p className="text-center text-sm leading-relaxed text-muted-foreground max-w-md">
            Lovarank grows your SEO rankings and organic traffic while you focus
            on growing your business.
          </p>

          {/* Avatar row with stats */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {testimonials.slice(0, 4).map((testimonial, i) => (
                <img
                  key={i}
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border-2 border-background object-cover"
                />
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4 fill-yellow-400"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                100k+ Articles Generated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="mt-2">
        <TestimonialsCarousel
          testimonials={testimonials}
          title="Join thousands of happy customers"
          subtitle="Real testimonials from real users who transformed their SEO"
          speed={80}
        />
      </div>
    </div>
  );
}
