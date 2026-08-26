import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { collectionRuns } from "@/db/schema";
import { authorizeCollector, authorizeViewer } from "@/lib/auth";
import { runCollection } from "@/lib/collector";

function defaultWindow(): { from: string; to: string } {
  const toDate = new Date();
  toDate.setUTCDate(toDate.getUTCDate() + 1);
  const fromDate = new Date();
  fromDate.setUTCDate(fromDate.getUTCDate() - 2);
  return { from: fromDate.toISOString().slice(0, 10), to: toDate.toISOString().slice(0, 10) };
}

export async function POST(request: Request) {
  const denied = authorizeCollector(request);
  if (denied) return denied;
  const defaults = defaultWindow();
  const payload = (await request.json().catch(() => ({}))) as { from?: string; to?: string };
  const from = /^\d{4}-\d{2}-\d{2}$/.test(payload.from ?? "") ? payload.from! : defaults.from;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(payload.to ?? "") ? payload.to! : defaults.to;

  try {
    return Response.json({ summary: await runCollection(from, to) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Collection failed." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const denied = authorizeViewer(request);
  if (denied) return denied;
  const rows = await getDb()
    .select()
    .from(collectionRuns)
    .orderBy(desc(collectionRuns.startedAt), desc(collectionRuns.id))
    .limit(20);
  return Response.json({ items: rows });
}
