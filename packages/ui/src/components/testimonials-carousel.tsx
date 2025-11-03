'use client';

import { TestimonialCard } from '@workspace/ui/components/testimonial-card';
import { cn } from '@workspace/ui/lib/utils';

import { testimonials as defaultTestimonials } from '@workspace/lib/data/testimonials';

interface Testimonial {
  name: string;
  username?: string;
  date: string;
  content: string;
  avatar?: string;
}

interface TestimonialsCarouselProps {
  testimonials?: Testimonial[];
  speed?: number; // Speed in seconds, default 60
  title?: string;
  subtitle?: string;
  className?: string;
  rows?: 1 | 2; // Number of rows
}

export function TestimonialsCarousel({
  testimonials = defaultTestimonials,
  speed = 60,
  title = 'Trusted by thousands',
  subtitle = 'See what our customers are saying',
  className,
  rows = 2,
}: TestimonialsCarouselProps) {
  // Split testimonials into two groups for two rows
  const midPoint = Math.ceil(testimonials.length / 2);
  const firstRowTestimonials =
    rows === 2 ? testimonials.slice(0, midPoint) : testimonials;
  const secondRowTestimonials = rows === 2 ? testimonials.slice(midPoint) : [];

  const renderRow = (
    rowTestimonials: Testimonial[],
    direction: 'forward' | 'reverse',
    rowIndex: number
  ) => (
    <div
      className={cn(
        'group inline-flex w-full flex-nowrap',
        rowIndex === 1 && 'mt-6'
      )}
    >
      {/* First set of testimonials */}
      <div
        className={cn(
          'flex items-start justify-center gap-6 group-hover:[animation-play-state:paused] md:justify-start',
          direction === 'forward'
            ? 'animate-[infinite-scroll_var(--scroll-speed)_linear_infinite]'
            : 'animate-[infinite-scroll-reverse_var(--scroll-speed)_linear_infinite]'
        )}
        style={{ '--scroll-speed': `${speed}s` } as React.CSSProperties}
      >
        {rowTestimonials.map((testimonial, index) => (
          <div
            key={`first-${rowIndex}-${index}`}
            className="w-[22rem] flex-shrink-0"
          >
            <TestimonialCard
              testimonial={testimonial}
              className="h-full transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        ))}
      </div>

      {/* Duplicated set for seamless loop */}
      <div
        className={cn(
          'flex items-start justify-center gap-6 group-hover:[animation-play-state:paused] md:justify-start',
          direction === 'forward'
            ? 'animate-[infinite-scroll_var(--scroll-speed)_linear_infinite]'
            : 'animate-[infinite-scroll-reverse_var(--scroll-speed)_linear_infinite]'
        )}
        style={{ '--scroll-speed': `${speed}s` } as React.CSSProperties}
        aria-hidden="true"
      >
        {rowTestimonials.map((testimonial, index) => (
          <div
            key={`second-${rowIndex}-${index}`}
            className="w-[22rem] flex-shrink-0"
          >
            <TestimonialCard
              testimonial={testimonial}
              className="h-full transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className={cn('relative w-full overflow-hidden py-12', className)}>
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-primary-500/5 blur-3xl" />
      </div>

      {/* Header */}
      {/* {(title || subtitle) && (
        <div className="mx-auto mb-12 max-w-3xl px-4 text-center">
          {title && (
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )} */}

      {/* Carousel Container with mask */}
      <div className="relative mx-auto flex max-w-[94rem] flex-col justify-center">
        {/* Gradient masks on sides */}
        <div className="absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent" />

        {/* First Row - scrolls left to right */}
        {renderRow(firstRowTestimonials, 'forward', 0)}

        {/* Second Row - scrolls right to left (reverse) */}
        {rows === 2 &&
          secondRowTestimonials.length > 0 &&
          renderRow(secondRowTestimonials, 'reverse', 1)}
      </div>

      {/* Hint text */}
      {/* <p className="mt-8 text-center text-xs text-muted-foreground italic">
        Real testimonials from real customers
      </p> */}
    </section>
  );
}
