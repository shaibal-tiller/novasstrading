import Link from "next/link";
import { site } from "@/lib/content";

export default function NotFound() {
  return (
    <main className="flex min-h-[90vh] flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="font-mono text-sm font-semibold uppercase tracking-widest text-brass-dark">
        404
      </p>
      <h1 className="display-lg mt-4 text-ink">Page not found</h1>
      <p className="lede mt-6 max-w-md text-ink-muted">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link href="/" className="btn btn-primary">
          Return to Homepage
        </Link>
        <a href={`mailto:${site.email}`} className="btn btn-outline">
          Contact Support
        </a>
      </div>
    </main>
  );
}
