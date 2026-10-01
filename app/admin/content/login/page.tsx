"use client";

import { useState, useTransition } from "react";
import { loginAction, requestOtpAction, verifyOtpAction } from "./actions";

const ADMIN_EMAIL = "it-support@novasstrading.com";

type Mode = "password" | "otp";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("password");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="display-md text-ink">Content portal sign in</h1>

      <div className="flex gap-2" role="tablist" aria-label="Sign-in method">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "password"}
          className={`btn ${mode === "password" ? "btn-primary" : ""}`}
          onClick={() => setMode("password")}
        >
          Password
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "otp"}
          className={`btn ${mode === "otp" ? "btn-primary" : ""}`}
          onClick={() => setMode("otp")}
        >
          Email me a code
        </button>
      </div>

      {mode === "password" ? <PasswordForm /> : <OtpForm />}
    </main>
  );
}

function PasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="field-label" htmlFor="email">Email</label>
        <input className="field mt-2" id="email" name="email" type="email" required autoComplete="username" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <input className="field mt-2" id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function OtpForm() {
  const [codeSent, setCodeSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [requestPending, startRequestTransition] = useTransition();
  const [verifyPending, startVerifyTransition] = useTransition();

  function handleRequestCode(formData: FormData) {
    setRequestError(null);
    startRequestTransition(async () => {
      const result = await requestOtpAction(undefined, formData);
      if (result && "error" in result) {
        setRequestError(result.error);
        return;
      }
      setCodeSent(true);
    });
  }

  function handleVerifyCode(formData: FormData) {
    setVerifyError(null);
    startVerifyTransition(async () => {
      const result = await verifyOtpAction(undefined, formData);
      if (result?.error) {
        setVerifyError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={handleRequestCode} className="flex flex-col gap-4">
        <div>
          <label className="field-label" htmlFor="otp-email">Email</label>
          <input
            className="field mt-2"
            id="otp-email"
            name="email"
            type="email"
            value={ADMIN_EMAIL}
            readOnly
          />
        </div>
        {requestError && <p className="text-sm text-red-600">{requestError}</p>}
        <button type="submit" className="btn btn-primary" disabled={requestPending}>
          {requestPending ? "Sending…" : codeSent ? "Resend code" : "Send code"}
        </button>
      </form>

      {codeSent && (
        <form action={handleVerifyCode} className="flex flex-col gap-4">
          <input type="hidden" name="email" value={ADMIN_EMAIL} />
          <div>
            <label className="field-label" htmlFor="code">6-digit code</label>
            <input
              className="field mt-2"
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoComplete="one-time-code"
            />
          </div>
          {verifyError && <p className="text-sm text-red-600">{verifyError}</p>}
          <button type="submit" className="btn btn-primary" disabled={verifyPending}>
            {verifyPending ? "Verifying…" : "Verify"}
          </button>
        </form>
      )}
    </div>
  );
}

