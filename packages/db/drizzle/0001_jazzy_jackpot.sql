ALTER TABLE "organization" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "color" varchar(7) DEFAULT '#808080' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "color_hex_value" CHECK ("workspace"."color" ~ '^#[0-9A-Fa-f]{6}$');
