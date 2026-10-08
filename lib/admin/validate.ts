/**
 * Plain-language checks shared by the editor's edit boxes (and the server action that saves them).
 * Each returns an error sentence for a person to read, or null when the value is fine.
 */

/**
 * A link field may be left blank, or hold a web address (http/https), a mailto: or a tel: link —
 * the only kinds the registry's "url" fields (site URL, WhatsApp, Maps, contact cards) ever use.
 */
export function urlError(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text === "") return null;
  const message =
    "That doesn't look like a link. Please enter a full web address starting with https:// (or a mailto: / tel: link).";
  if (/\s/.test(text)) return message;
  if (/^(mailto|tel):\S+$/i.test(text)) return null;
  try {
    const u = new URL(text);
    if ((u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".")) return null;
  } catch {
    // falls through to the message below
  }
  return message;
}

/** True when a list item's title box has real text in it. */
export function hasTitle(fields: Record<string, unknown>, titleField: string): boolean {
  const raw = fields[titleField];
  if (Array.isArray(raw)) return raw.some((v) => String(v).trim() !== "");
  return raw != null && String(raw).trim() !== "";
}
