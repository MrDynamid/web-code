const KEY = "mehr:recently-viewed";
const LIMIT = 8;

export function readRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(slug: string) {
  if (typeof window === "undefined") return;
  const next = [slug, ...readRecentlyViewed().filter((entry) => entry !== slug)].slice(0, LIMIT);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — recently viewed is a nicety, never a blocker */
  }
}
