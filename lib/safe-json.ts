/**
 * JSON for a <script type="application/ld+json"> tag. Some values can come from the content store
 * (the Google description), so characters that could close the tag or start markup are written as
 * \u escapes: still valid JSON, read back identically by crawlers.
 */
export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/ /g, "\\u2028")
    .replace(/ /g, "\\u2029");
}
