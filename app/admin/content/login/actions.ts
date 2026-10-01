"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { login, requestOtp, verifyOtp } from "@/lib/cpanel-api";
import { signSessionCookie } from "@/lib/session";

export type LoginState = { error: string } | undefined;
export type RequestOtpState = { error: string } | { sent: true } | undefined;
export type VerifyOtpState = { error: string } | undefined;

function establishSession(token: string): void {
  cookies().set("nova_admin_session", signSessionCookie(token), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/admin/content",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let token: string;
  try {
    token = await login(email, password);
  } catch {
    return { error: "Invalid email or password." };
  }

  establishSession(token);
  redirect("/admin/content");
}

export async function requestOtpAction(_prevState: RequestOtpState, formData: FormData): Promise<RequestOtpState> {
  const email = String(formData.get("email") ?? "");

  try {
    await requestOtp(email);
  } catch {
    return { error: "Could not send the code. Please try again." };
  }

  // PHP always responds { ok: true } regardless of outcome (it never reveals
  // whether the email matches an admin account), so there is nothing to
  // branch on here beyond network/transport failures above — just advance
  // the UI to the code-entry step.
  return { sent: true };
}

export async function verifyOtpAction(_prevState: VerifyOtpState, formData: FormData): Promise<VerifyOtpState> {
  const email = String(formData.get("email") ?? "");
  const code = String(formData.get("code") ?? "");

  let token: string;
  try {
    token = await verifyOtp(email, code);
  } catch {
    return { error: "Invalid or expired code." };
  }

  establishSession(token);
  redirect("/admin/content");
}

