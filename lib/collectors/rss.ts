import { getRuntimeEnv } from "@/lib/runtime-env";
import type { LeadCandidate } from "@/lib/types";

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, names: string[]): string {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match?.[1]) return decodeXml(match[1]);
  }
  return "";
}

function linkFromBlock(block: string): string {
  const value = tag(block, ["link"]);
  if (/^https?:\/\//i.test(value)) return value;
  return block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ?? "";
}

function feedUrls(): string[] {
  const raw = getRuntimeEnv().RSS_FEEDS?.trim() ?? "";
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
    } catch {
      return [];
    }
  }
  return raw.split(",").map((value) => value.trim()).filter(Boolean);
}

export async function collectFromRss(): Promise<LeadCandidate[]> {
  const output: LeadCandidate[] = [];
  for (const feedUrl of feedUrls()) {
    const response = await fetch(feedUrl, { headers: { "user-agent": "MCSteelLeadMonitor/1.0" } });
    if (!response.ok) continue;
    const xml = await response.text();
    const blocks = [
      ...(xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? []),
      ...(xml.match(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi) ?? []),
    ];

    for (const block of blocks) {
      const sourceUrl = linkFromBlock(block);
      if (!/^https?:\/\//i.test(sourceUrl)) continue;
      const published = tag(block, ["pubDate", "published", "updated"]);
      const date = new Date(published);
      output.push({
        source: new URL(feedUrl).hostname.replace(/^www\./, ""),
        sourceUrl,
        externalId: tag(block, ["guid", "id"]) || null,
        title: tag(block, ["title"]),
        body: tag(block, ["description", "content", "summary"]),
        authorName: tag(block, ["author", "dc:creator"]) || null,
        publishedAt: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
        isPublic: true,
      });
    }
  }
  return output;
}
