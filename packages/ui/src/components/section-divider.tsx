import React from 'react';
import { cn } from '../lib/utils';

type Props = {
  nbItems?: number;
  className?: string;
  itemClassName?: string;
};

const SectionDivider = ({ nbItems = 200, className, itemClassName }: Props) => {
  return (
    <div
      className={cn(
        'flex h-24 items-stretch justify-center overflow-x-hidden border-b border-t border-neutral-200',
        className
      )}
    >
      {new Array(nbItems).fill(0).map((each, index) => (
        <div
          key={index}
          className={cn(
            'h-full w-4 flex-none border-l border-neutral-200 bg-gradient-to-r from-white to-stone-50',
            itemClassName
          )}
        />
      ))}
    </div>
  );
};

export default SectionDivider;
