import React from 'react';
import LogoIcon from './logo-icon';
import { cn } from '../lib/utils';

type Props = {
  className?: string;
};

function BrandCard({ className }: Props) {
  return (
    <div className={cn('text-left', className)}>
      <LogoIcon className="mb-2 -ml-2" />
      <h1 className="text-3xl md:text-6xl font-bold text-gray-900 dark:text-white font-display">
        The AI Agent that Grows
        <br />
        Your Organic Traffic
      </h1>
    </div>
  );
}

export default BrandCard;
