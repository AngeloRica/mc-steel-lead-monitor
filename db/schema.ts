import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable(
  "leads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    source: text("source").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalId: text("external_id"),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    authorName: text("author_name"),
    location: text("location"),
    publishedAt: text("published_at").notNull(),
    collectedAt: text("collected_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    matchedKeywords: text("matched_keywords").notNull().default("[]"),
    intentScore: integer("intent_score").notNull().default(0),
    status: text("status").notNull().default("new"),
  },
  (table) => [
    uniqueIndex("leads_source_url_unique").on(table.sourceUrl),
    index("leads_published_at_idx").on(table.publishedAt),
    index("leads_source_idx").on(table.source),
    index("leads_status_idx").on(table.status),
  ],
);

export const contacts = sqliteTable(
  "contacts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    leadId: integer("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    name: text("name"),
    emails: text("emails").notNull().default("[]"),
    phones: text("phones").notNull().default("[]"),
    sourceUrl: text("source_url").notNull(),
    capturedAt: text("captured_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    reviewStatus: text("review_status").notNull().default("unreviewed"),
    collectionBasis: text("collection_basis")
      .notNull()
      .default("explicit_public_business_inquiry"),
  },
  (table) => [
    uniqueIndex("contacts_lead_id_unique").on(table.leadId),
    index("contacts_captured_at_idx").on(table.capturedAt),
    index("contacts_review_status_idx").on(table.reviewStatus),
  ],
);

export const collectionRuns = sqliteTable(
  "collection_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    finishedAt: text("finished_at"),
    status: text("status").notNull().default("running"),
    fetchedCount: integer("fetched_count").notNull().default(0),
    qualifiedCount: integer("qualified_count").notNull().default(0),
    insertedCount: integer("inserted_count").notNull().default(0),
    errorMessage: text("error_message"),
  },
  (table) => [index("collection_runs_started_at_idx").on(table.startedAt)],
);
