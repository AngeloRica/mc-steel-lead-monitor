CREATE TABLE `collection_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`finished_at` text,
	`status` text DEFAULT 'running' NOT NULL,
	`fetched_count` integer DEFAULT 0 NOT NULL,
	`qualified_count` integer DEFAULT 0 NOT NULL,
	`inserted_count` integer DEFAULT 0 NOT NULL,
	`error_message` text
);
--> statement-breakpoint
CREATE INDEX `collection_runs_started_at_idx` ON `collection_runs` (`started_at`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`name` text,
	`emails` text DEFAULT '[]' NOT NULL,
	`phones` text DEFAULT '[]' NOT NULL,
	`source_url` text NOT NULL,
	`captured_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	`collection_basis` text DEFAULT 'explicit_public_business_inquiry' NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contacts_lead_id_unique` ON `contacts` (`lead_id`);--> statement-breakpoint
CREATE INDEX `contacts_captured_at_idx` ON `contacts` (`captured_at`);--> statement-breakpoint
CREATE INDEX `contacts_review_status_idx` ON `contacts` (`review_status`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`source_url` text NOT NULL,
	`external_id` text,
	`title` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`author_name` text,
	`location` text,
	`published_at` text NOT NULL,
	`collected_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`matched_keywords` text DEFAULT '[]' NOT NULL,
	`intent_score` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_source_url_unique` ON `leads` (`source_url`);--> statement-breakpoint
CREATE INDEX `leads_published_at_idx` ON `leads` (`published_at`);--> statement-breakpoint
CREATE INDEX `leads_source_idx` ON `leads` (`source`);--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`);