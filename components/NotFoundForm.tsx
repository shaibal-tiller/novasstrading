"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

type Status = "idle" | "submitting" | "success";

/**
 * "Contact support" form on the 404 page. It posts to the same /api/contact route as the
 * Contact section (same spam checks, same email), with the missing page's address filled in
 * so the team knows exactly which link is broken.
 */
export function NotFoundForm({ email }: { email: string }) {
  const pathname = usePathname() ?? "";
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    if (data.company_website) {
      setStatus("success"); // honeypot: pretend it worked
      return;
    }
    if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
      setError("Please fill in your name, email and a short message.");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: "Broken link / page not found",
          message: `Page not found: ${pathname || "(unknown)"}\n\n${data.message}`,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          referrer: typeof document !== "undefined" ? document.referrer : "",
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("idle");
        setError(json.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("idle");
      setError(`Network error. Please try again, or email us at ${email}.`);
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-ink/10 bg-ivory p-6 text-center">
        <h2 className="font-display text-xl text-ink">Thank you, we&apos;ve got it</h2>
        <p className="mt-2 text-sm text-ink-muted">Our team will get back to you at the email you gave us.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-md space-y-4 rounded-2xl border border-ink/10 bg-ivory p-6 text-left">
      <div>
        <h2 className="font-display text-xl text-ink">Contact support</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Tell us what you were looking for and we&apos;ll help. We&apos;ll note which page you tried to open.
        </p>
      </div>
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />
      <div>
        <label htmlFor="nf-name" className="field-label">Your name</label>
        <input id="nf-name" name="name" type="text" autoComplete="name" required className="field mt-2" />
      </div>
      <div>
        <label htmlFor="nf-email" className="field-label">Your email</label>
        <input id="nf-email" name="email" type="email" autoComplete="email" required className="field mt-2" />
      </div>
      <div>
        <label htmlFor="nf-message" className="field-label">Message</label>
        <textarea id="nf-message" name="message" rows={4} required className="field mt-2" />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button type="submit" disabled={status === "submitting"} className="btn btn-primary w-full">
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
