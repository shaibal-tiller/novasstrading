"use client";

import { useState } from "react";
import { contact, site } from "@/lib/content";
import { clsx } from "@/lib/utils";

type Status = "idle" | "submitting" | "success";
type FormState = { status: Status; errorMsg?: string };


export function Contact() {
  const [state, setState] = useState<FormState>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "submitting" });
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    // Honeypot check (client-side fast-path)
    if (data.company_website) {
      setState({ status: "success" });
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          // Pass client-side metadata for enriched admin email
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          referrer:  typeof document  !== "undefined" ? document.referrer : "",
        }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string; message?: string };

      if (res.ok && json.ok) {
        setState({ status: "success" });
        form.reset();
      } else {
        setState({ status: "idle", errorMsg: json.error ?? "Something went wrong. Please try again." });
      }
    } catch {
      setState({ status: "idle", errorMsg: "Network error. Please check your connection and try again." });
    }
  }

  return (
    <section id="contact" className="section-wrap">
      <div className="section-card section-card--cream">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow">{contact.eyebrow}</p>
            <h2 className="display-lg mt-5 text-ink">{contact.title}</h2>
            <p className="lede mt-5 max-w-md">{contact.intro}</p>

            <div className="mt-10 space-y-5">
              {contact.cards.map((c) => (
                <div key={c.label}>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass-dark">
                    {c.label}
                  </p>
                  {c.href ? (
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="mt-1 block font-display text-lg text-ink transition-colors hover:text-brass-dark"
                    >
                      {c.value}
                    </a>
                  ) : (
                    <p className="mt-1 max-w-xs text-ink-muted">{c.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-canvas p-6 sm:p-8">
            {state.status === "success" ? (
              <div
                role="status"
                className="flex h-full min-h-[20rem] flex-col items-center justify-center text-center"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-brass/15 text-brass-dark">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4 10-11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className="mt-5 font-display text-2xl text-ink">
                  Inquiry received
                </h3>
                <p className="mt-2 max-w-sm text-sm text-ink-muted">
                  Thank you. Our team will respond within 24 hours at the email
                  you provided.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <input
                  type="text"
                  name="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute left-[-9999px] h-0 w-0 opacity-0"
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field name="name" label="Your name" required />
                  <Field name="email" label="Email address" type="email" required />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field name="companyName" label="Company name" />
                  <Field name="phone" label="Phone / WhatsApp" type="tel" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field name="country" label="Country" />
                  <div>
                    <label htmlFor="subject" className="field-label">
                      Inquiry subject
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      className="field mt-2 appearance-none"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select a subject
                      </option>
                      {contact.subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="field-label">
                    Message details <span className="text-brass-dark">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    className="field mt-2 resize-y"
                    placeholder="Tell us about your sourcing specs, fabric needs, or trims inquiry…"
                  />
                </div>

                {state.errorMsg && (
                  <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                    {state.errorMsg}{" "}
                    <a href={`mailto:${site.email}`} className="underline font-semibold">
                      {site.email}
                    </a>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={state.status === "submitting"}
                  className={clsx(
                    "btn btn-accent w-full sm:w-auto",
                    state.status === "submitting" && "cursor-wait opacity-70",
                  )}
                >
                  {state.status === "submitting" ? "Sending…" : "Submit inquiry"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Full-width office location map — the map itself is interactive
            (pan / zoom); only the Open Map button leaves for Google Maps. */}
        <div className="group relative mt-12 overflow-hidden rounded-2xl border border-ink/10">
          <iframe
            src="https://maps.google.com/maps?q=Nova+SS+Trading,+House+357,+Road+5,+Baridhara+DOHS,+Dhaka,+Bangladesh&t=&z=16&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="380"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-[280px] w-full bg-stone/40 sm:h-[380px]"
            title="Office Location Map"
          />
          <a
            href={site.address.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open office location in Google Maps"
            className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-full border border-ink/10 bg-ivory/95 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink shadow-[0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur transition-transform duration-300 hover:scale-105 hover:text-brass-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            <span>Open Map</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 10L10 2M10 2H4.5M10 2V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
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
      <label htmlFor={name} className="field-label">
        {label} {required && <span className="text-brass-dark">*</span>}
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
        className="field mt-2"
      />
    </div>
  );
}
