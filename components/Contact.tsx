"use client";

import { useState } from "react";
import { contact, site } from "@/lib/content";
import { clsx } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    if (data.company_website) {
      setStatus("success");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="section-wrap">
      <div className="section-card">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
          <div>
            <h2 className="display-lg text-ink">{contact.heading}</h2>
            <p className="lede mt-6 max-w-md">{contact.body}</p>
            
            <div className="mt-12 space-y-6">
              <div>
                <p className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  Email
                </p>
                <a
                  href={`mailto:${site.email}`}
                  className="mt-2 block font-display text-xl text-ink transition-colors hover:text-accent"
                >
                  {site.email}
                </a>
              </div>
              <div>
                <p className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  Phone
                </p>
                <a
                  href={`tel:${site.phoneHref}`}
                  className="mt-2 block font-display text-xl text-ink transition-colors hover:text-accent"
                >
                  {site.phone}
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-ink/10 bg-white p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)]">
            {status === "success" ? (
              <div
                role="status"
                className="flex h-full min-h-[20rem] flex-col items-center justify-center text-center"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent-dark">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4 10-11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className="mt-6 font-display text-2xl text-ink">
                  Inquiry received
                </h3>
                <p className="mt-3 max-w-sm text-sm text-ink-muted">
                  Thank you. Our team will respond within 24 hours at the email
                  you provided.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-8">
                <input
                  type="text"
                  name="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute left-[-9999px] h-0 w-0 opacity-0"
                />

                <div className="grid gap-8 sm:grid-cols-2">
                  <Field name="name" label="Your name" required />
                  <Field name="email" label="Email address" type="email" required />
                </div>
                
                <div>
                  <label htmlFor="subject" className="field-label block mb-2">
                    Inquiry subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="field appearance-none"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a subject...
                    </option>
                    {contact.subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="field-label block mb-2">
                    Message details <span className="text-accent">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    className="field resize-y bg-transparent"
                    placeholder="Tell us about your requirements..."
                  />
                </div>

                {status === "error" && (
                  <p role="alert" className="text-sm text-accent-dark">
                    Something went wrong. Please email{" "}
                    <a href={`mailto:${site.email}`} className="underline">
                      {site.email}
                    </a>{" "}
                    directly.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className={clsx(
                    "btn btn-primary w-full",
                    status === "submitting" && "cursor-wait opacity-70",
                  )}
                >
                  {status === "submitting" ? "Sending..." : "Submit inquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label block mb-2">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={
          name === "email"
            ? "email"
            : name === "name"
              ? "name"
              : name === "phone"
                ? "tel"
                : "off"
        }
        className="field"
      />
    </div>
  );
}
