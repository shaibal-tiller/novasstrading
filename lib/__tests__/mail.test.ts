// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendBrevoEmail } from "@/lib/mail";

beforeEach(() => {
  vi.stubEnv("BREVO_API_KEY", "test-brevo-key");
});

describe("sendBrevoEmail", () => {
  it("posts the payload to Brevo's transactional email API and returns true on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ messageId: "abc-123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendBrevoEmail({ subject: "Hi" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/smtp/email",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "api-key": "test-brevo-key" }),
        body: JSON.stringify({ subject: "Hi" }),
      })
    );
    expect(result).toBe(true);
  });

  it("returns false when Brevo does not return a messageId", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ error: "invalid" }) }));

    expect(await sendBrevoEmail({ subject: "Hi" })).toBe(false);
  });
});
