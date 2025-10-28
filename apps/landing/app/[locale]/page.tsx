import Cta from '@/components/cta';
import Faqs from '@/components/faqs';
import Features from '@/components/features-home';
import Hero from '@/components/hero-home';

export default function Home() {
  return (
    <>
      <Hero />
      {/* <BusinessCategories /> */}
      {/* <LargeTestimonial /> */}
      {/* <FeaturesPlanet /> */}
      <Features />
      <Faqs />
      {/* <TestimonialsCarousel /> */}
      <Cta />
    </>
  );
}
