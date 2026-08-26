import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { authorizeViewer } from "@/lib/auth";

const ALLOWED_STATUSES = new Set(["new", "reviewed", "contacted", "quoted", "won", "not_relevant"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = authorizeViewer(request);
  if (denied) return denied;

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  const payload = (await request.json()) as { status?: string };
  if (!Number.isInteger(id) || !ALLOWED_STATUSES.has(payload.status ?? "")) {
    return Response.json({ error: "Invalid lead or status." }, { status: 400 });
  }

  const [updated] = await getDb()
    .update(leads)
    .set({ status: payload.status! })
    .where(eq(leads.id, id))
    .returning({ id: leads.id, status: leads.status });

  return updated
    ? Response.json({ item: updated })
    : Response.json({ error: "Lead not found." }, { status: 404 });
}
