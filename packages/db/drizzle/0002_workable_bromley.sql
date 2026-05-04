ALTER TABLE "workspace" DROP CONSTRAINT "color_hex_value";--> statement-breakpoint
ALTER TABLE "organization" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "workspace" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "workspace" ALTER COLUMN "color" SET DATA TYPE varchar(7);--> statement-breakpoint
ALTER TABLE "workspace" ALTER COLUMN "color" SET DEFAULT '#808080';--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "color_hex_value" CHECK ("workspace"."color" ~ '^#[0-9A-Fa-f]{6}$');
