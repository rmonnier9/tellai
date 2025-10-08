import React from 'react';
import { cn } from '../lib/utils';

type Props = {
  className?: string;
};

function LogoIcon({ className }: Props) {
  return (
    <img
      src="/images/lovarank-logo-icon-animated-2.png"
      alt="Logo"
      className={cn('w-10 h-10', className)}
    />
  );
}

export default LogoIcon;
