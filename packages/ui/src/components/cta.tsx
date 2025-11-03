import React from 'react';
import { TestimonialsCarousel } from './testimonials-carousel';

type Props = {};

const CTA = (props: Props) => {
  return (
    <div className="w-full bg-white py-12 md:py-24 ">
      <div className="px-6 md:px-12">
        <span className="inline-flex font-fun text-primary-400 text-3xl font-bold mb-4">
          Ready to start ranking?
        </span>
        <h2 className="text-3xl md:text-4xl font-bold  mb-4">
          Rank higher without lifting a finger
        </h2>
        <p className="text-xl  mb-8 max-w-2xl  text-gray-600">
          The only AI agent that discovers hidden keywords, creates optimized
          content, and publishes automatically. 1,000+ businesses already
          ranking
        </p>
        <a
          href={process.env.NEXT_PUBLIC_DASHBOARD_URL}
          className="inline-flex items-center justify-center px-8 py-4 text-base text-white font-semibold bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          Get Started for Free
        </a>
      </div>

      <TestimonialsCarousel
        title="Join thousands of happy customers"
        subtitle="Real testimonials from real users who transformed their SEO"
        speed={80}
        rows={1}
      />
    </div>
  );
};

export default CTA;
