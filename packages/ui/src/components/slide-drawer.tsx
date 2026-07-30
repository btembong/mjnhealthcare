'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';
import { cn } from '../lib/utils';

type SlideDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  side?: 'right' | 'left';
  width?: string;
};

export function SlideDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  side = 'right',
  width = 'sm:max-w-lg',
}: SlideDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn(width, 'overflow-y-auto', className)}>
        {(title || description) && (
          <SheetHeader className="mb-5">
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        {children}
      </SheetContent>
    </Sheet>
  );
}
