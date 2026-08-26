import { count, eq, gte } from "drizzle-orm";
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
    db.select({ value: count() }).from(leads),
    db.select({ value: count() }).from(leads).where(gte(leads.publishedAt, today.toISOString())),
    db.select({ value: count() }).from(leads).where(eq(leads.status, "new")),
    db.select({ value: count() }).from(contacts),
  ]);

  return Response.json({
    totalLeads: allLeads[0]?.value ?? 0,
    todayLeads: todayLeads[0]?.value ?? 0,
    newLeads: newLeads[0]?.value ?? 0,
    contacts: contactCount[0]?.value ?? 0,
  });
}
