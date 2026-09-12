/**
 * Client-side mirror of the Backend's extractYouTubeVideoId, used only to
 * preview the thumbnail before saving. The stored thumbnail_url always comes
 * from the Backend.
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url || typeof url !== "string") return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
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
