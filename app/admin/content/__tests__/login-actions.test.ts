import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cpanel-api");
vi.mock("next/headers");
vi.mock("next/navigation");

import { loginAction, requestOtpAction, verifyOtpAction } from "@/app/admin/content/login/actions";
import { login, requestOtp, verifyOtp } from "@/lib/cpanel-api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const loginMock = login as ReturnType<typeof vi.fn>;
const requestOtpMock = requestOtp as ReturnType<typeof vi.fn>;
const verifyOtpMock = verifyOtp as ReturnType<typeof vi.fn>;
const setMock = vi.fn();
const redirectMock = redirect as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv("SESSION_COOKIE_SECRET", "test-cookie-secret");
  loginMock.mockReset();
  requestOtpMock.mockReset();
  verifyOtpMock.mockReset();
  setMock.mockReset();
  redirectMock.mockReset();
  (cookies as ReturnType<typeof vi.fn>).mockReturnValue({
    set: setMock,
  });
});

describe("loginAction", () => {
  it("sets an httpOnly session cookie and redirects to the dashboard on success", async () => {
    loginMock.mockResolvedValue("cpanel-token");
    const form = new FormData();
    form.set("email", "a@example.com");
    form.set("password", "secret123");

    await loginAction(undefined, form);

    expect(setMock).toHaveBeenCalledWith(
      "nova_admin_session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: "strict" })
    );
    expect(redirectMock).toHaveBeenCalledWith("/admin/content");
  });

  it("sets a 30-day cookie maxAge", async () => {
    loginMock.mockResolvedValue("cpanel-token");
    const form = new FormData();
    form.set("email", "a@example.com");
    form.set("password", "secret123");

    await loginAction(undefined, form);

    expect(setMock).toHaveBeenCalledWith(
      "nova_admin_session",
      expect.any(String),
      expect.objectContaining({ maxAge: 60 * 60 * 24 * 30 })
    );
  });

  it("returns an error message and does not set a cookie on invalid credentials", async () => {
    loginMock.mockRejectedValue(new Error("invalid credentials"));
    const form = new FormData();
    form.set("email", "a@example.com");
    form.set("password", "wrong");

    const result = await loginAction(undefined, form);

    expect(result).toEqual({ error: "Invalid email or password." });
    expect(setMock).not.toHaveBeenCalled();
  });
});

describe("requestOtpAction", () => {
  it("calls requestOtp and reports the code as sent", async () => {
    requestOtpMock.mockResolvedValue(undefined);
    const form = new FormData();
    form.set("email", "it-support@novasstrading.com");

    const result = await requestOtpAction(undefined, form);

    expect(requestOtpMock).toHaveBeenCalledWith("it-support@novasstrading.com");
    expect(result).toEqual({ sent: true });
  });

  it("reports the code as sent even though PHP always answers { ok: true }", async () => {
    // requestOtp() resolves regardless of whether the email matched an admin
    // account server-side — there is nothing in the response to branch on.
    requestOtpMock.mockResolvedValue(undefined);
    const form = new FormData();
    form.set("email", "someone-else@example.com");

    const result = await requestOtpAction(undefined, form);

    expect(result).toEqual({ sent: true });
  });

  it("returns an error only on a transport/network failure", async () => {
    requestOtpMock.mockRejectedValue(new Error("network error"));
    const form = new FormData();
    form.set("email", "it-support@novasstrading.com");

    const result = await requestOtpAction(undefined, form);

    expect(result).toEqual({ error: "Could not send the code. Please try again." });
  });
});

describe("verifyOtpAction", () => {
  it("sets a session cookie with a 30-day maxAge and redirects on success", async () => {
    verifyOtpMock.mockResolvedValue("cpanel-token");
    const form = new FormData();
    form.set("email", "it-support@novasstrading.com");
    form.set("code", "123456");

    await verifyOtpAction(undefined, form);

    expect(verifyOtpMock).toHaveBeenCalledWith("it-support@novasstrading.com", "123456");
    expect(setMock).toHaveBeenCalledWith(
      "nova_admin_session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: "strict", maxAge: 60 * 60 * 24 * 30 })
    );
    expect(redirectMock).toHaveBeenCalledWith("/admin/content");
  });

  it("returns an error message and does not set a cookie on an invalid code", async () => {
    verifyOtpMock.mockRejectedValue(new Error("invalid or expired code"));
    const form = new FormData();
    form.set("email", "it-support@novasstrading.com");
    form.set("code", "000000");

    const result = await verifyOtpAction(undefined, form);

    expect(result).toEqual({ error: "Invalid or expired code." });
    expect(setMock).not.toHaveBeenCalled();
  });
});

