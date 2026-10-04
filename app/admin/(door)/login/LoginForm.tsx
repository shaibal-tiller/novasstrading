"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeAdminEmail } from "@/lib/admin-redirect";

const RESEND_COOLDOWN_SECONDS = 60;
const AUTH_BASE = "/admin/inventory/api/auth";

type ApiResult = { ok: boolean; status: number; error?: string };

async function postJson(path: string, body: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(`${AUTH_BASE}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    let data: { ok?: boolean; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      // Non-JSON (e.g. the sign-in service is not reachable behind the rewrite).
    }
    return { ok: res.ok && data.ok !== false, status: res.status, error: data.error };
  } catch {
    return { ok: false, status: 0, error: "Could not reach the sign-in service. Check your connection and try again." };
  }
}

/** The shared admin sign-in: email -> 6-digit code. No passwords. */
export function LoginForm({ next }: { next: string }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [emailInput, setEmailInput] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  async function requestCode(target: string): Promise<void> {
    setPending(true);
    setError(null);
    setNotice(null);
    const result = await postJson("request-code", { email: target });
    setPending(false);
    if (result.ok) {
      setEmail(target);
      setStep("code");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setNotice(`If ${target} has admin access, a 6-digit code is on its way. It is valid for 10 minutes.`);
      return;
    }
    if (result.status === 429) {
      // A code was sent moments ago — let them enter it rather than wait here.
      setEmail(target);
      setStep("code");
      setCooldown((c) => (c > 0 ? c : RESEND_COOLDOWN_SECONDS));
    }
    setError(result.error || "Could not send a code. Please try again.");
  }

  function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = normalizeAdminEmail(emailInput);
    if (!target) {
      setError("Enter your email address.");
      return;
    }
    void requestCode(target);
  }

  async function onCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await postJson("verify-code", { email, code });
    if (result.ok) {
      window.location.assign(next);
      return;
    }
    setPending(false);
    setError(result.error || "That code did not work. Check it and try again.");
  }

  function resetToEmailStep() {
    setStep("email");
    setCode("");
    setError(null);
    setNotice(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display-md text-ink">Sign in</h1>

      {step === "email" ? (
        <form onSubmit={onEmailSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="field-label" htmlFor="admin-email">
              Work email
            </label>
            <input
              className="field mt-2"
              id="admin-email"
              name="email"
              type="text"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
              placeholder="name@novasstrading.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <p className="mt-2 text-xs text-ink-muted">Just your name works too — we add @novasstrading.com.</p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Sending…" : "Email me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={onCodeSubmit} className="flex flex-col gap-4">
          {notice && <p className="text-sm text-ink-muted">{notice}</p>}
          <div>
            <label className="field-label" htmlFor="admin-code">
              6-digit code sent to {email}
            </label>
            <input
              ref={codeRef}
              className="field mt-2 font-mono text-lg tracking-[0.4em]"
              id="admin-code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
              autoFocus
              required
              maxLength={12}
              value={code}
              // Paste-friendly: keep only digits, so "123 456" or "123-456" works.
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary" disabled={pending || code.length !== 6}>
            {pending ? "Checking…" : "Sign in"}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="btn btn-outline" onClick={resetToEmailStep} disabled={pending}>
              Use a different email
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => void requestCode(email)}
              disabled={pending || cooldown > 0}
            >
              {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
