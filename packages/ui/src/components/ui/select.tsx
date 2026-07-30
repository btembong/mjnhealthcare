'use client';
import * as React from 'react';
import * as SP from '@radix-ui/react-select';
import { Check, CaretDown, CaretUp } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';

const Select = SP.Root;
const SelectGroup = SP.Group;
const SelectValue = SP.Value;

const SelectTrigger = React.forwardRef<React.ElementRef<typeof SP.Trigger>, React.ComponentPropsWithoutRef<typeof SP.Trigger>>(
  ({ className, children, ...props }, ref) => (
    <SP.Trigger
      ref={ref}
      className={cn('flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1', className)}
      {...props}
    >
      {children}
      <SP.Icon asChild><CaretDown className="h-4 w-4 text-muted-foreground shrink-0" /></SP.Icon>
    </SP.Trigger>
  ),
);
SelectTrigger.displayName = SP.Trigger.displayName;

const SelectContent = React.forwardRef<React.ElementRef<typeof SP.Content>, React.ComponentPropsWithoutRef<typeof SP.Content>>(
  ({ className, children, position = 'popper', ...props }, ref) => (
    <SP.Portal>
      <SP.Content
        ref={ref}
        position={position}
        className={cn('relative z-50 max-h-96 min-w-32 overflow-hidden rounded-xl border border-border bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1', className)}
        {...props}
      >
        <SP.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
          <CaretUp className="h-4 w-4" />
        </SP.ScrollUpButton>
        <SP.Viewport className={cn('p-1', position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]')}>
          {children}
        </SP.Viewport>
        <SP.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
          <CaretDown className="h-4 w-4" />
        </SP.ScrollDownButton>
      </SP.Content>
    </SP.Portal>
  ),
);
SelectContent.displayName = SP.Content.displayName;

const SelectLabel = React.forwardRef<React.ElementRef<typeof SP.Label>, React.ComponentPropsWithoutRef<typeof SP.Label>>(
  ({ className, ...props }, ref) => <SP.Label ref={ref} className={cn('px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground', className)} {...props} />,
);
SelectLabel.displayName = SP.Label.displayName;

const SelectItem = React.forwardRef<React.ElementRef<typeof SP.Item>, React.ComponentPropsWithoutRef<typeof SP.Item>>(
  ({ className, children, ...props }, ref) => (
    <SP.Item ref={ref} className={cn('relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm text-foreground outline-none focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className)} {...props}>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SP.ItemIndicator><Check className="h-4 w-4 text-primary" /></SP.ItemIndicator>
      </span>
      <SP.ItemText>{children}</SP.ItemText>
    </SP.Item>
  ),
);
SelectItem.displayName = SP.Item.displayName;

const SelectSeparator = React.forwardRef<React.ElementRef<typeof SP.Separator>, React.ComponentPropsWithoutRef<typeof SP.Separator>>(
  ({ className, ...props }, ref) => <SP.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />,
);
SelectSeparator.displayName = SP.Separator.displayName;

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator };
