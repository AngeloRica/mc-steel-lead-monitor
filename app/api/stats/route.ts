import { and, count, eq, gte, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { contacts, leads } from "@/db/schema";
import { authorizeViewer } from "@/lib/auth";

export async function GET(request: Request) {
  const denied = authorizeViewer(request);
  if (denied) return denied;

  const db = getDb();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [allLeads, todayLeads, newLeads, contactCount] = await Promise.all([
    db.select({ value: count() }).from(leads).where(ne(leads.status, "not_relevant")),
    db.select({ value: count() }).from(leads).where(and(gte(leads.publishedAt, today.toISOString()), ne(leads.status, "not_relevant"))),
    db.select({ value: count() }).from(leads).where(eq(leads.status, "new")),
    db.select({ value: count() }).from(contacts).innerJoin(leads, eq(contacts.leadId, leads.id)).where(ne(leads.status, "not_relevant")),
  ]);

  return Response.json({
    totalLeads: allLeads[0]?.value ?? 0,
    todayLeads: todayLeads[0]?.value ?? 0,
    newLeads: newLeads[0]?.value ?? 0,
    contacts: contactCount[0]?.value ?? 0,
  });
}
