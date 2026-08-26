import { and, asc, desc, eq, gte, like, lte, or, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { authorizeViewer } from "@/lib/auth";

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const denied = authorizeViewer(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const source = url.searchParams.get("source")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const search = url.searchParams.get("search")?.trim();
  const from = url.searchParams.get("from")?.trim();
  const to = url.searchParams.get("to")?.trim();
  const order = url.searchParams.get("order") === "oldest" ? "oldest" : "newest";
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0") || 0);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? "250") || 250));

  const conditions: SQL[] = [];
  if (source && source !== "all") conditions.push(eq(leads.source, source));
  if (status && status !== "all") conditions.push(eq(leads.status, status));
  if (from) conditions.push(gte(leads.publishedAt, new Date(`${from}T00:00:00+08:00`).toISOString()));
  if (to) conditions.push(lte(leads.publishedAt, new Date(`${to}T23:59:59+08:00`).toISOString()));
  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "")} %`.replace(" %", "%");
    conditions.push(
      or(
        like(leads.title, pattern),
        like(leads.body, pattern),
        like(leads.authorName, pattern),
        like(leads.location, pattern),
        like(leads.matchedKeywords, pattern),
      )!,
    );
  }

  const rows = await getDb()
    .select()
    .from(leads)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(order === "oldest" ? asc(leads.publishedAt) : desc(leads.publishedAt), desc(leads.id))
    .limit(limit)
    .offset(offset);

  return Response.json({
    items: rows.map((row) => ({ ...row, matchedKeywords: parseJsonArray(row.matchedKeywords) })),
    nextOffset: rows.length === limit ? offset + rows.length : null,
  });
}
