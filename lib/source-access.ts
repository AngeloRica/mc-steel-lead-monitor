function normalizedHostname(url: URL): string {
  return url.hostname.toLowerCase().replace(/^(?:www\.|m\.|mbasic\.)/, "");
}

/**
 * Keep only Facebook URLs whose structure identifies a public-content surface.
 * This cannot override a post that is deleted or made private later, but it
 * removes the group, share, profile, story, Marketplace, and unclear links
 * that most often lead to Facebook's "content isn't available" screen.
 */
export function isLikelyPublicSourceUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const hostname = normalizedHostname(url);
  if (hostname !== "facebook.com" && !hostname.endsWith(".facebook.com")) {
    return true;
  }

  const path = url.pathname.toLowerCase().replace(/\/{2,}/g, "/");
  const blockedPrefixes = [
    "/groups/",
    "/share/",
    "/marketplace/",
    "/profile.php",
    "/story.php",
    "/permalink.php",
    "/login/",
    "/people/",
    "/photo/",
  ];
  if (blockedPrefixes.some((prefix) => path.startsWith(prefix))) return false;

  if (/^\/reel\/[a-z0-9._-]+\/?$/i.test(path)) return true;
  if (/^\/watch\/?$/i.test(path) && url.searchParams.has("v")) return true;

  const segments = path.split("/").filter(Boolean);
  if (segments.length < 3) return false;
  return ["posts", "videos"].includes(segments[1]) && Boolean(segments[2]);
}
