import "server-only";

/**
 * Sends a transactional email via Brevo's REST API.
 * Returns true when Brevo accepted the message (i.e. a `messageId` came back).
 */
export async function sendBrevoEmail(payload: object): Promise<boolean> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": process.env.BREVO_API_KEY ?? "",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as Record<string, unknown>;
  return Boolean(json.messageId);
}

