'use client';
import * as React from 'react';
import * as SA from '@radix-ui/react-scroll-area';
import { cn } from '../../lib/utils';

const ScrollArea = React.forwardRef<React.ElementRef<typeof SA.Root>, React.ComponentPropsWithoutRef<typeof SA.Root>>(
  ({ className, children, ...props }, ref) => (
    <SA.Root ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
      <SA.Viewport className="h-full w-full rounded-[inherit]">{children}</SA.Viewport>
      <ScrollBar />
      <SA.Corner />
    </SA.Root>
  ),
);
ScrollArea.displayName = SA.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof SA.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof SA.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <SA.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className,
    )}
    {...props}
  >
    <SA.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </SA.ScrollAreaScrollbar>
));
ScrollBar.displayName = SA.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
