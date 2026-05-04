ALTER TABLE "workspace" DROP CONSTRAINT "color_hex_value";--> statement-breakpoint
ALTER TABLE "workspace" ALTER COLUMN "color" SET DATA TYPE varchar(9);--> statement-breakpoint
UPDATE "workspace" SET "color" = "color" || 'FF' WHERE "color" ~ '^#[0-9A-fa-f]{6}$';--> statement-breakpoint
ALTER TABLE "workspace" ALTER COLUMN "color" SET DEFAULT '#808080FF';--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "color_hex_value" CHECK ("workspace"."color" ~ '^#[0-9A-Fa-f]{8}$');
