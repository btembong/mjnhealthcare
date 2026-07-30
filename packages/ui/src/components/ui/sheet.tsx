'use client';
import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const Sheet = D.Root;
const SheetTrigger = D.Trigger;
const SheetClose = D.Close;
const SheetPortal = D.Portal;

const SheetOverlay = React.forwardRef<React.ElementRef<typeof D.Overlay>, React.ComponentPropsWithoutRef<typeof D.Overlay>>(
  ({ className, ...props }, ref) => (
    <D.Overlay
      ref={ref}
      className={cn('fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className)}
      {...props}
    />
  ),
);
SheetOverlay.displayName = D.Overlay.displayName;

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-white p-6 shadow-xl transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b border-border data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom: 'inset-x-0 bottom-0 border-t border-border data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right: 'inset-y-0 right-0 h-full w-3/4 border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: { side: 'right' },
  },
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof D.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<React.ElementRef<typeof D.Content>, SheetContentProps>(
  ({ side = 'right', className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <D.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
        <SheetClose className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted transition-all focus:outline-none focus:ring-2 focus:ring-ring">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetClose>
        {children}
      </D.Content>
    </SheetPortal>
  ),
);
SheetContent.displayName = D.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2', className)} {...props} />
);
const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
const SheetTitle = React.forwardRef<React.ElementRef<typeof D.Title>, React.ComponentPropsWithoutRef<typeof D.Title>>(
  ({ className, ...props }, ref) => <D.Title ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />,
);
SheetTitle.displayName = D.Title.displayName;
const SheetDescription = React.forwardRef<React.ElementRef<typeof D.Description>, React.ComponentPropsWithoutRef<typeof D.Description>>(
  ({ className, ...props }, ref) => <D.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />,
);
SheetDescription.displayName = D.Description.displayName;

export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
