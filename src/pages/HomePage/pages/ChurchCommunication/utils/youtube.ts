/**
 * Client-side mirror of the Backend's extractYouTubeVideoId, used only to
 * preview the thumbnail before saving. The stored thumbnail_url always comes
 * from the Backend.
 *
 * The sermon form's Yup validator makes the URL's protocol optional
 * (`^(https?:\/\/)?`), so a link pasted without a scheme (e.g.
 * "www.youtube.com/watch?v=abc123") must still resolve here instead of
 * failing `new URL()` and silently showing no preview. `ensureAbsoluteUrl`
 * normalizes a missing or protocol-relative ("//...") scheme to "https://"
 * before parsing, mirroring the same helper in
 * `MinistrySchool/Components/LearningUnit.tsx`.
 */
const ensureAbsoluteUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
};

export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url || typeof url !== "string") return null;

  const normalized = ensureAbsoluteUrl(url);
  if (!normalized) return null;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    return parsed.pathname.split("/").filter(Boolean)[0] || null;
  }

  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com"
  ) {
    if (parsed.pathname === "/watch") return parsed.searchParams.get("v");

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (
      segments.length >= 2 &&
      ["embed", "shorts", "live", "v"].includes(segments[0])
    ) {
      return segments[1];
    }
  }

  return null;
};

export const youtubeThumbnail = (videoId: string | null): string | null =>
  videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
