const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Optional field: callers should skip this check when the value is empty. */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!/^[+\d\s()-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
}

/** Trims and collapses repeated spaces: "  ana   lopez " -> "ana lopez". */
export function normalizeName(value: string): string {
  return value.trim().split(/\s+/).filter(Boolean).join(" ");
}

export const MIN_PASSWORD_LENGTH = 6;

/** Reset / confirmation codes are digits only; strips spaces people paste in. */
export function cleanCode(value: string): string {
  return value.replace(/\D/g, "");
}
