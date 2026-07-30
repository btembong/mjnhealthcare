'use client';
import * as React from 'react';
import * as DM from '@radix-ui/react-dropdown-menu';
import { Check, CaretRight } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';

const DropdownMenu = DM.Root;
const DropdownMenuTrigger = DM.Trigger;
const DropdownMenuGroup = DM.Group;
const DropdownMenuPortal = DM.Portal;
const DropdownMenuSub = DM.Sub;
const DropdownMenuRadioGroup = DM.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DM.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DM.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <DM.SubTrigger ref={ref} className={cn('flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none focus:bg-muted data-[state=open]:bg-muted', inset && 'pl-8', className)} {...props}>
    {children}
    <CaretRight className="ml-auto h-4 w-4" />
  </DM.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DM.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<React.ElementRef<typeof DM.SubContent>, React.ComponentPropsWithoutRef<typeof DM.SubContent>>(
  ({ className, ...props }, ref) => (
    <DM.SubContent ref={ref} className={cn('z-50 min-w-32 overflow-hidden rounded-xl border border-border bg-white p-1 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className)} {...props} />
  ),
);
DropdownMenuSubContent.displayName = DM.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<React.ElementRef<typeof DM.Content>, React.ComponentPropsWithoutRef<typeof DM.Content>>(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <DM.Portal>
      <DM.Content ref={ref} sideOffset={sideOffset} className={cn('z-50 min-w-32 overflow-hidden rounded-xl border border-border bg-white p-1 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', className)} {...props} />
    </DM.Portal>
  ),
);
DropdownMenuContent.displayName = DM.Content.displayName;

const DropdownMenuItem = React.forwardRef<React.ElementRef<typeof DM.Item>, React.ComponentPropsWithoutRef<typeof DM.Item> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <DM.Item ref={ref} className={cn('relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none transition-colors focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50', inset && 'pl-8', className)} {...props} />
  ),
);
DropdownMenuItem.displayName = DM.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<React.ElementRef<typeof DM.CheckboxItem>, React.ComponentPropsWithoutRef<typeof DM.CheckboxItem>>(
  ({ className, children, checked, ...props }, ref) => (
    <DM.CheckboxItem ref={ref} className={cn('relative flex cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm text-foreground outline-none transition-colors focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className)} checked={checked} {...props}>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DM.ItemIndicator><Check className="h-4 w-4" /></DM.ItemIndicator>
      </span>
      {children}
    </DM.CheckboxItem>
  ),
);
DropdownMenuCheckboxItem.displayName = DM.CheckboxItem.displayName;

const DropdownMenuLabel = React.forwardRef<React.ElementRef<typeof DM.Label>, React.ComponentPropsWithoutRef<typeof DM.Label> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <DM.Label ref={ref} className={cn('px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground', inset && 'pl-8', className)} {...props} />
  ),
);
DropdownMenuLabel.displayName = DM.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<React.ElementRef<typeof DM.Separator>, React.ComponentPropsWithoutRef<typeof DM.Separator>>(
  ({ className, ...props }, ref) => <DM.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />,
);
DropdownMenuSeparator.displayName = DM.Separator.displayName;

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem };
