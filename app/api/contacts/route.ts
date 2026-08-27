import { and, desc, eq, gte, like, lte, ne, or, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { contacts, leads } from "@/db/schema";
import { authorizeViewer } from "@/lib/auth";

function parseArray(value: string): string[] {
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
  const search = url.searchParams.get("search")?.trim();
  const source = url.searchParams.get("source")?.trim();
  const reviewStatus = url.searchParams.get("reviewStatus")?.trim();
  const from = url.searchParams.get("from")?.trim();
  const to = url.searchParams.get("to")?.trim();
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? "0") || 0);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? "250") || 250));

  const conditions: SQL[] = [ne(leads.status, "not_relevant")];
  if (source && source !== "all") conditions.push(eq(leads.source, source));
  if (reviewStatus && reviewStatus !== "all") conditions.push(eq(contacts.reviewStatus, reviewStatus));
  if (from) conditions.push(gte(leads.publishedAt, new Date(`${from}T00:00:00+08:00`).toISOString()));
  if (to) conditions.push(lte(leads.publishedAt, new Date(`${to}T23:59:59+08:00`).toISOString()));
  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "")}%`;
    conditions.push(
      or(
        like(contacts.name, pattern),
        like(contacts.emails, pattern),
        like(contacts.phones, pattern),
        like(leads.title, pattern),
        like(leads.body, pattern),
      )!,
    );
  }

  const rows = await getDb()
    .select({
      id: contacts.id,
      leadId: contacts.leadId,
      name: contacts.name,
      emails: contacts.emails,
      phones: contacts.phones,
      sourceUrl: contacts.sourceUrl,
      capturedAt: contacts.capturedAt,
      reviewStatus: contacts.reviewStatus,
      collectionBasis: contacts.collectionBasis,
      source: leads.source,
      postTitle: leads.title,
      publishedAt: leads.publishedAt,
      leadStatus: leads.status,
    })
    .from(contacts)
    .innerJoin(leads, eq(contacts.leadId, leads.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(leads.publishedAt), desc(contacts.id))
    .limit(limit)
    .offset(offset);

  return Response.json({
    items: rows.map((row) => ({
      ...row,
      emails: parseArray(row.emails),
      phones: parseArray(row.phones),
    })),
    nextOffset: rows.length === limit ? offset + rows.length : null,
  });
}
