import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { contacts } from "@/db/schema";
import { authorizeViewer } from "@/lib/auth";

const ALLOWED = new Set(["unreviewed", "verified", "invalid", "do_not_contact"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = authorizeViewer(request);
  if (denied) return denied;
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  const payload = (await request.json()) as { reviewStatus?: string };
  if (!Number.isInteger(id) || !ALLOWED.has(payload.reviewStatus ?? "")) {
    return Response.json({ error: "Invalid contact or review status." }, { status: 400 });
  }
  const [updated] = await getDb()
    .update(contacts)
    .set({ reviewStatus: payload.reviewStatus! })
    .where(eq(contacts.id, id))
    .returning({ id: contacts.id, reviewStatus: contacts.reviewStatus });
  return updated
    ? Response.json({ item: updated })
    : Response.json({ error: "Contact not found." }, { status: 404 });
}
