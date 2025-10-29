'use client';

import { Card } from '@workspace/ui/components/card';
import { cn } from '@workspace/ui/lib/utils';

interface TestimonialCardProps {
  testimonial: {
    name: string;
    username?: string;
    date: string;
    content: string;
    avatar?: string;
  };
  className?: string;
}

export function TestimonialCard({
  testimonial,
  className,
}: TestimonialCardProps) {
  return (
    <Card
      className={cn(
        'group relative flex flex-col gap-4 border-border/40 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5',
        className
      )}
    >
      {/* Twitter icon */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {testimonial.avatar ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <img
                src={testimonial.avatar}
                alt={`${testimonial.name} avatar`}
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-semibold text-white">
              {testimonial.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name & Username */}
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {testimonial.name}
            </span>
            {testimonial.username && (
              <span className="text-sm text-muted-foreground">
                @{testimonial.username}
              </span>
            )}
          </div>
        </div>

        {/* X/Twitter Icon */}
        <svg
          className="h-4 w-4 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed text-foreground/90">
        {testimonial.content}
      </p>

      {/* Date */}
      <span className="text-xs text-muted-foreground">{testimonial.date}</span>
    </Card>
  );
}
