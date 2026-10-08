import Link from "next/link";
import { site } from "@/lib/content";
import { NotFoundForm } from "@/components/NotFoundForm";

export default function NotFound() {
  return (
    <main className="flex min-h-[90vh] flex-col items-center justify-center bg-canvas px-6 py-16 text-center">
      <p className="font-mono text-sm font-semibold uppercase tracking-widest text-brass-dark">
        404
      </p>
      <h1 className="display-lg mt-4 text-ink">Page not found</h1>
      <p className="lede mt-6 max-w-md text-ink-muted">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8">
        <Link href="/" className="btn btn-primary">
          Return to Homepage
        </Link>
      </div>
      <div className="mt-12 flex w-full justify-center">
        <NotFoundForm email={site.email} />
      </div>
      <p className="mt-6 text-sm text-ink-muted">
        Or email us directly at{" "}
        <a className="text-brass-dark underline underline-offset-2" href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </p>
    </main>
  );
}
