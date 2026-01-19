/**
 * Heading Atom
 * Basic heading component with semantic HTML
 */

import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../../../core/utils/cn';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ as, level, variant, className, children, ...props }, ref) => {
    // Support both 'level' and 'variant' props for backward compatibility
    const headingLevel = level || (variant ? parseInt(variant.replace('h', '')) : 1) as 1 | 2 | 3 | 4 | 5 | 6;
    const Component = (as || `h${headingLevel}`) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    
    const sizeClasses = {
      1: 'text-4xl font-bold',
      2: 'text-3xl font-bold',
      3: 'text-2xl font-semibold',
      4: 'text-xl font-semibold',
      5: 'text-lg font-semibold',
      6: 'text-base font-semibold',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          'text-[color:var(--foreground)]',
          sizeClasses[headingLevel],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Heading.displayName = 'Heading';

