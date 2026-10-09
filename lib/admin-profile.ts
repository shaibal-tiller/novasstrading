/** "it-support@novasstrading.com" -> "It Support". Only the part before the "@" is used. */
export function displayNameFor(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local.split(/[._\-+\s]+/).filter(Boolean);
  if (words.length === 0) return email;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/** Up to two letters for the avatar: "it-support@…" -> "IS", "admin@…" -> "A". */
export function initialsFor(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local.split(/[._\-+\s]+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}
