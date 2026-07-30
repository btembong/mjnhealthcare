'use client';

import Link from 'next/link';
import { Button } from '@mjn/ui';
import { HouseSimple, ArrowLeft, MagnifyingGlass } from '@phosphor-icons/react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <MagnifyingGlass className="h-12 w-12 text-muted-foreground" />
      </div>
      <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">404</p>
      <h1 className="mb-3 text-3xl font-extrabold text-foreground">Page not found</h1>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been moved. Head back to your dashboard.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/"><HouseSimple className="h-4 w-4" /> Back to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login"><ArrowLeft className="h-4 w-4" /> Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
