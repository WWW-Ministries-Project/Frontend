import type { EventOnlineLink } from "@/utils/api/events/interfaces";

/**
 * Mirrors ONLINE_PLATFORMS in Backend/src/modules/events/onlineLinks.ts.
 * The form renders one field per entry here, so adding a platform is one
 * object on each side — see docs/EVENT_ONLINE_LINKS_BACKEND_CONTRACT.md.
 */
export const ONLINE_PLATFORMS = [
  {
    key: "zoom",
    label: "Zoom",
    field: "zoom_url",
    placeholder: "https://zoom.us/j/1234567890",
    hostHints: ["zoom.us", "zoom.com"],
  },
  {
    key: "youtube",
    label: "YouTube",
    field: "youtube_url",
    placeholder: "https://youtube.com/watch?v=...",
    hostHints: ["youtube.com", "youtu.be"],
  },
] as const;

export type OnlinePlatform = (typeof ONLINE_PLATFORMS)[number];

/** Form-shaped values: one string per platform, keyed by `field`. */
export type OnlineLinkFormValues = Record<string, string>;

export const emptyOnlineLinkValues = (): OnlineLinkFormValues =>
  ONLINE_PLATFORMS.reduce<OnlineLinkFormValues>((acc, platform) => {
    acc[platform.field] = "";
    return acc;
  }, {});

/** API array → flat form values. */
export const onlineLinksToFormValues = (
  links: EventOnlineLink[] | undefined | null
): OnlineLinkFormValues => {
  const values = emptyOnlineLinkValues();
  (links || []).forEach((link) => {
    const platform = ONLINE_PLATFORMS.find((p) => p.key === link.platform);
    if (platform) values[platform.field] = link.url || "";
  });
  return values;
};

/**
 * Flat form values → API array. Every platform is included, empty url and
 * all: an empty url is how the API is told to delete that link.
 */
export const formValuesToOnlineLinks = (
  values: OnlineLinkFormValues
): { platform: string; url: string }[] =>
  ONLINE_PLATFORMS.map((platform) => ({
    platform: platform.key,
    url: String(values[platform.field] ?? "").trim(),
  }));

/** Blocking error, or "" when the value is acceptable (empty counts as acceptable). */
export const onlineLinkError = (value: string): string => {
  const url = String(value ?? "").trim();
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Enter a link starting with http:// or https://";
    }
    return "";
  } catch {
    return "Enter a valid link, e.g. https://zoom.us/j/1234567890";
  }
};

/**
 * Non-blocking hint when the host does not look like the platform. Churches
 * use vanity domains and shorteners, so this never blocks a save.
 */
export const onlineLinkWarning = (
  platform: OnlinePlatform,
  value: string
): string => {
  const url = String(value ?? "").trim();
  if (!url || onlineLinkError(url)) return "";
  try {
    const host = new URL(url).hostname.toLowerCase();
    const matches = platform.hostHints.some(
      (hint) => host === hint || host.endsWith(`.${hint}`)
    );
    return matches
      ? ""
      : `This does not look like a ${platform.label} link. It will still be saved.`;
  } catch {
    return "";
  }
};

export const hasOnlineLinkErrors = (values: OnlineLinkFormValues): boolean =>
  ONLINE_PLATFORMS.some((platform) =>
    Boolean(onlineLinkError(values[platform.field] ?? ""))
  );
