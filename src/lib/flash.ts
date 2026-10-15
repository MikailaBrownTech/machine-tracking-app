// A success message that survives a redirect: set just before a form submits,
// shown by <FlashToaster /> on the next page. Client-only.
const KEY = "flash-toast";
const MAX_AGE_MS = 10_000;

export function setFlash(message: string): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ message, at: Date.now() }));
  } catch {
    // Storage unavailable: skip the toast.
  }
}

export function clearFlash(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function takeFlash(): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      "at" in parsed &&
      typeof parsed.message === "string" &&
      typeof parsed.at === "number" &&
      Date.now() - parsed.at < MAX_AGE_MS
    ) {
      return parsed.message;
    }
  } catch {
    // ignore
  }
  return null;
}
