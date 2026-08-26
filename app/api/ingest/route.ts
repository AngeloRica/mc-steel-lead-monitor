import { authorizeCollector } from "@/lib/auth";
import { ingestCandidates } from "@/lib/collector";
import type { LeadCandidate } from "@/lib/types";

export async function POST(request: Request) {
  const denied = authorizeCollector(request);
  if (denied) return denied;

  const payload = (await request.json()) as { items?: LeadCandidate[] };
  if (!Array.isArray(payload.items)) {
    return Response.json({ error: "items must be an array." }, { status: 400 });
  }
  if (payload.items.length > 5_000) {
    return Response.json({ error: "Send no more than 5,000 items per request." }, { status: 413 });
  }

  return Response.json({ summary: await ingestCandidates(payload.items) });
}
