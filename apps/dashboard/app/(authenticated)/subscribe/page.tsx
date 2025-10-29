import prisma from '@workspace/db/prisma/client';
import getSession from '@workspace/lib/get-session';
import BrandCard from '@workspace/ui/components/brand-card';
import PricingTable from '@workspace/ui/components/pricing-table';
import { TestimonialsCarousel } from '@workspace/ui/components/testimonials-carousel';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Subscribe',
};

const testimonials = [
  // First Row Testimonials
  {
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHBvcnRyYWl0fGVufDB8MXwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=900',
    name: 'Marcus Chen',
    username: 'marcusbuilds',
    date: 'Jul 31, 2025',
    content:
      "Hands down the best investment for my SaaS. @lovarank_com has become essential to my workflow. Even if they tripled the price, I'd still renew without hesitation.",
  },
  {
    avatar:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cG9ydHJhaXR8ZW58MHwxfDB8fHww&auto=format&fit=crop&q=60&w=900',
    name: 'Sarah Mitchell',
    username: 'sarahgrowth',
    date: 'Jul 15, 2025',
    content:
      'The results speak for themselves: my domain authority went from 8 to 28 in under 2 months. I literally just connected my blog and let it run. If you need better rankings, this is it.',
  },
  {
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9ydHJhaXR8ZW58MHwxfDB8fHww&auto=format&fit=crop&q=60&w=900',
    name: 'David Rodriguez',
    username: 'davroddev',
    date: 'Jul 15, 2025',
    content:
      'Seeing incredible improvements in my site metrics thanks to @lovarank_com. The automated link building feature saves me hours every week and handles what used to be the most tedious part of SEO strategy.',
  },
  {
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cG9ydHJhaXR8ZW58MHwxfDB8fHww&auto=format&fit=crop&q=60&w=900',
    name: 'Emma Thompson',
    username: 'emmacreates',
    date: 'Jul 13, 2025',
    content:
      "Been using @lovarank_com from launch day and couldn't be happier! The quality of content it generates is consistently impressive. You can see it in action on our company blog.",
  },
  {
    avatar:
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzV8fHBvcnRyYWl0fGVufDB8MXwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=900',
    name: 'Lisa Zhang',
    username: 'lisazhang_dev',
    date: 'Aug 5, 2025',
    content:
      'Finally, an SEO tool that actually understands what founders need. @lovarank_com has helped me scale content production 10x while maintaining quality. Game changer!',
  },
  // Second Row Testimonials
  {
    avatar:
      'https://images.unsplash.com/photo-1596075780750-81249df16d19?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fHBvcnRyYWl0fGVufDB8MXwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=900',
    name: 'Alex Park',
    username: 'alexparktech',
    date: 'Dec 17, 2024',
    content: '@lovarank_com is brilliantly simple yet incredibly powerful! 🚀',
  },
  {
    avatar:
      'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzB8fHBvcnRyYWl0fGVufDB8MXwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=900',
    name: 'Jordan Lee',
    username: 'jordanshipss',
    date: 'Nov 15, 2024',
    content:
      "Just tried @lovarank_com and I'm blown away by how smooth the entire SEO process is. The unified dashboard for content planning, keyword research, and scheduling is exactly what I needed. Fantastic work!",
  },
  {
    avatar:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cG9ydHJhaXR8ZW58MHwxfDB8fHww&auto=format&fit=crop&q=60&w=900',
    name: 'Priya Sharma',
    username: 'priyabuilds',
    date: 'Jan 23, 2025',
    content:
      'Absolutely brilliant solution! This tackles the biggest pain point for anyone doing SEO. The team at @lovarank_com has built something truly special here. Major kudos!',
  },
  {
    avatar:
      'https://images.unsplash.com/photo-1590086782792-42dd2350140d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fHBvcnRyYWl0fGVufDB8MXwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=900',
    name: "Ryan O'Connor",
    username: 'ryanocodes',
    date: 'Dec 16, 2024',
    content:
      'Perfect for busy founders who need SEO results but lack the bandwidth to manage it manually. @lovarank_com delivers quality without the time investment. Highly recommended!',
  },
  {
    avatar:
      'https://images.unsplash.com/photo-1542327897-d73f4005b533?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fHBvcnRyYWl0fGVufDB8MXwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=900',
    name: 'Kenji Yamamoto',
    username: 'kenjicodes',
    date: 'Sep 22, 2024',
    content:
      'The ROI on @lovarank_com is insane. My organic traffic doubled in 6 weeks and the content quality beats what we were producing in-house. Worth every penny!',
  },
];

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
            <p className="mt-4 text-left text-lg text-muted-foreground">
              Start your 3-day trial and unlock all features
            </p>
          </div>
          <PricingTable initialProduct={activeProduct} />
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="mt-16">
        <TestimonialsCarousel
          testimonials={testimonials}
          title="Join thousands of happy customers"
          // subtitle="Real testimonials from real users who transformed their SEO"
          speed={80}
        />
      </div>
    </div>
  );
}
