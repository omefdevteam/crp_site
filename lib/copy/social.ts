// Footer social links. One value per network for every language, edited in
// Website text > Social links. Kept free of server imports: the footer uses
// the same check before it renders a link.

export const SOCIAL_KEYS = ["instagram", "linkedin", "x", "youtube", "tiktok", "discord"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];
export type SocialLinks = Readonly<Partial<Record<SocialKey, string>>>;

/** Bundled defaults: empty means the icon is hidden until a link is published. */
export const SOCIAL_DEFAULTS: Readonly<Record<SocialKey, string>> = {
  instagram: "",
  linkedin: "",
  x: "",
  youtube: "",
  tiktok: "",
  discord: "",
};

export const SOCIAL_LINK_MAX = 2048;

export type SocialLinkCheck =
  | { readonly ok: true; readonly href: string | null }
  | { readonly ok: false; readonly reason: "too-long" | "not-https" | "not-a-link" };

/**
 * Empty (or only spaces) is allowed and means "hide the icon". Anything else
 * must be an absolute https:// address the URL parser accepts, with a real
 * host name and no user name or password in it. javascript:, data:, http:
 * and every other scheme are refused.
 */
export function checkSocialLink(raw: string): SocialLinkCheck {
  if (raw.length > SOCIAL_LINK_MAX) return { ok: false, reason: "too-long" };
  const value = raw.trim();
  if (!value) return { ok: true, href: null };
  if (/[\s\u0000-\u001f\u007f]/.test(value)) return { ok: false, reason: "not-a-link" };
  if (!/^https:\/\//i.test(value)) return { ok: false, reason: "not-https" };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: "not-a-link" };
  }
  if (url.protocol !== "https:") return { ok: false, reason: "not-https" };
  if (url.username || url.password) return { ok: false, reason: "not-a-link" };
  const host = url.hostname;
  if (!host.includes(".") || host.startsWith(".") || host.endsWith(".")) return { ok: false, reason: "not-a-link" };
  if (url.href.length > SOCIAL_LINK_MAX) return { ok: false, reason: "too-long" };
  return { ok: true, href: url.href };
}

/** The address to render, or null when the stored value is empty or not a safe https link. */
export function socialHref(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const checked = checkSocialLink(raw);
  return checked.ok ? checked.href : null;
}
