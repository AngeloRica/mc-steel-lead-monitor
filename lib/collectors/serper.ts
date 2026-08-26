import {
  BUYER_INTENT_PHRASES,
  DEFAULT_PLATFORM_DOMAINS,
  PRODUCT_KEYWORDS,
} from "@/config/monitor";
import { getRuntimeEnv } from "@/lib/runtime-env";
import type { LeadCandidate } from "@/lib/types";

type SerperItem = {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
};

type SerperResponse = {
  organic?: SerperItem[];
};

function quotedOr(values: readonly string[]): string {
  return `(${values.map((value) => `"${value}"`).join(" OR ")})`;
}

function productBatches(): string[][] {
  const output: string[][] = [];
  for (let index = 0; index < PRODUCT_KEYWORDS.length; index += 6) {
    output.push([...PRODUCT_KEYWORDS.slice(index, index + 6)]);
  }
  return output;
}

function sourceFromUrl(url: string): string {
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  if (hostname.includes("facebook.com")) return "Facebook";
  if (hostname.includes("tiktok.com")) return "TikTok";
  if (hostname.includes("linkedin.com")) return "LinkedIn";
  if (hostname.includes("reddit.com")) return "Reddit";
  return hostname;
}

function relativeDate(value: string | undefined, now = new Date()): string {
  if (!value) return now.toISOString();
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();

  const relative = value.toLowerCase().match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/);
  if (!relative) return now.toISOString();
  const amount = Number(relative[1]);
  const unit = relative[2];
  const milliseconds: Record<string, number> = {
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
    year: 31_536_000_000,
  };
  return new Date(now.getTime() - amount * milliseconds[unit]).toISOString();
}

function buildQueries(from: string, to: string): string[] {
  const domainGroups = DEFAULT_PLATFORM_DOMAINS.map((domain) => `site:${domain}`);
  const intent = quotedOr(BUYER_INTENT_PHRASES);
  const dateWindow = `after:${from} before:${to}`;
  return productBatches().flatMap((products) =>
    domainGroups.map((domain) => `${domain} ${intent} ${quotedOr(products)} ${dateWindow}`),
  );
}

export async function collectFromPublicSearch(from: string, to: string): Promise<LeadCandidate[]> {
  const runtime = getRuntimeEnv();
  if (!runtime.SERPER_API_KEY) return [];

  const maxPages = Math.max(1, Number(runtime.MAX_PAGES_PER_QUERY ?? "10") || 10);
  const candidates: LeadCandidate[] = [];
  const seen = new Set<string>();

  for (const query of buildQueries(from, to)) {
    for (let page = 1; page <= maxPages; page += 1) {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": runtime.SERPER_API_KEY,
        },
        body: JSON.stringify({ q: query, page, num: 100, gl: "ph", hl: "en" }),
      });
      if (!response.ok) {
        throw new Error(`Search provider returned ${response.status}.`);
      }

      const payload = (await response.json()) as SerperResponse;
      const items = (payload.organic ?? []).filter((item) => item.link);
      if (!items.length) break;

      let newLinks = 0;
      for (const item of items) {
        const sourceUrl = item.link!;
        if (seen.has(sourceUrl)) continue;
        seen.add(sourceUrl);
        newLinks += 1;
        candidates.push({
          source: sourceFromUrl(sourceUrl),
          sourceUrl,
          title: item.title?.trim() ?? "",
          body: item.snippet?.trim() ?? "",
          publishedAt: relativeDate(item.date),
          isPublic: true,
        });
      }
      if (!newLinks || items.length < 10) break;
    }
  }

  return candidates;
}
