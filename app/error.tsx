"use client";

import { useEffect } from "react";
import Link from "next/link";
import { site } from "@/lib/content";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[90vh] flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="font-mono text-sm font-semibold uppercase tracking-widest text-brass-dark">
        500
      </p>
      <h1 className="display-lg mt-4 text-ink">Something went wrong</h1>
      <p className="lede mt-6 max-w-md text-ink-muted">
        An unexpected error occurred while loading this page.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button onClick={() => reset()} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Return Home
        </Link>
      </div>
    </main>
  );
}
