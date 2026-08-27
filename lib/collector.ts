import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { collectionRuns, contacts, leads } from "@/db/schema";
import { getDb } from "@/db";
import { collectFromRss } from "@/lib/collectors/rss";
import { collectFromPublicSearch } from "@/lib/collectors/serper";
import { extractExplicitPublicContacts } from "@/lib/contact-extractor";
import { assessBuyerIntent } from "@/lib/intent";
import type { LeadCandidate } from "@/lib/types";

type CollectionSummary = {
  fetchedCount: number;
  qualifiedCount: number;
  insertedCount: number;
};

function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function safeIso(value?: string | null): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export async function ingestCandidates(candidates: LeadCandidate[]): Promise<CollectionSummary> {
  const db = getDb();
  let qualifiedCount = 0;
  let insertedCount = 0;

  for (const candidate of candidates) {
    if (!candidate.isPublic || !validHttpUrl(candidate.sourceUrl)) continue;
    const assessment = assessBuyerIntent(candidate.title, candidate.body);
    if (!assessment.qualified) continue;
    qualifiedCount += 1;

    const inserted = await db
      .insert(leads)
      .values({
        source: candidate.source.slice(0, 80),
        sourceUrl: candidate.sourceUrl,
        externalId: candidate.externalId ?? null,
        title: candidate.title.slice(0, 500),
        body: candidate.body.slice(0, 6_000),
        authorName: candidate.authorName?.slice(0, 200) ?? null,
        location: candidate.location ?? assessment.location,
        publishedAt: safeIso(candidate.publishedAt),
        matchedKeywords: JSON.stringify(assessment.matchedKeywords),
        intentScore: assessment.score,
      })
      .onConflictDoNothing({ target: leads.sourceUrl })
      .returning({ id: leads.id });

    const leadId = inserted[0]?.id;
    if (!leadId) continue;
    insertedCount += 1;

    const extracted = extractExplicitPublicContacts(
      `${candidate.title}\n${candidate.body}`,
      candidate.authorName,
    );
    if (extracted.name || extracted.emails.length || extracted.phones.length) {
      await db.insert(contacts).values({
        leadId,
        name: extracted.name?.slice(0, 200) ?? null,
        emails: JSON.stringify(extracted.emails),
        phones: JSON.stringify(extracted.phones),
        sourceUrl: candidate.sourceUrl,
      });
    }
  }

  return { fetchedCount: candidates.length, qualifiedCount, insertedCount };
}

async function quarantineExistingOfferingPosts(): Promise<void> {
  const db = getDb();
  let lastId = 0;

  while (true) {
    const rows = await db
      .select({ id: leads.id, title: leads.title, body: leads.body })
      .from(leads)
      .where(and(eq(leads.status, "new"), gt(leads.id, lastId)))
      .orderBy(asc(leads.id))
      .limit(500);

    if (!rows.length) break;
    const offeringIds = rows
      .filter((row) => !assessBuyerIntent(row.title, row.body).qualified)
      .map((row) => row.id);

    if (offeringIds.length) {
      await db
        .update(leads)
        .set({ status: "not_relevant" })
        .where(inArray(leads.id, offeringIds));
    }

    lastId = rows[rows.length - 1].id;
  }
}

export async function runCollection(from: string, to: string): Promise<CollectionSummary> {
  const db = getDb();
  const [run] = await db.insert(collectionRuns).values({}).returning({ id: collectionRuns.id });

  try {
    await quarantineExistingOfferingPosts();
    const [searchCandidates, rssCandidates] = await Promise.all([
      collectFromPublicSearch(from, to),
      collectFromRss(),
    ]);
    const summary = await ingestCandidates([...searchCandidates, ...rssCandidates]);
    await db
      .update(collectionRuns)
      .set({
        finishedAt: new Date().toISOString(),
        status: "completed",
        fetchedCount: summary.fetchedCount,
        qualifiedCount: summary.qualifiedCount,
        insertedCount: summary.insertedCount,
      })
      .where(eq(collectionRuns.id, run.id));
    return summary;
  } catch (error) {
    await db
      .update(collectionRuns)
      .set({
        finishedAt: new Date().toISOString(),
        status: "failed",
        errorMessage: error instanceof Error ? error.message.slice(0, 1_000) : "Unknown error",
      })
      .where(eq(collectionRuns.id, run.id));
    throw error;
  }
}
