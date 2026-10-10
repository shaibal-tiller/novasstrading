/**
 * Where an analytics opt-in is required by law before we may set cookies: the EU, the other EEA
 * countries, the UK and Switzerland. Everywhere else (Bangladesh, the US, ...) visitors are counted
 * without a banner and can still opt out from "Cookie settings". To cover another country, add it here.
 */
const OPT_IN_COUNTRIES = new Set([
  // EU
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // Rest of the EEA, UK, Switzerland
  "IS", "LI", "NO", "GB", "CH",
]);

/** `country` is the visitor's ISO code from the host (Vercel's x-vercel-ip-country). Unknown means ask. */
export function consentRequired(country: string | null | undefined): boolean {
  const code = country?.trim().toUpperCase();
  if (!code) return true;
  return OPT_IN_COUNTRIES.has(code);
}
