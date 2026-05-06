CREATE TABLE "document" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"title" text NOT NULL,
	"color" varchar(9) DEFAULT '#808080FF' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "document_color_hex_value" CHECK ("document"."color" ~ '^#[0-9A-Fa-f]{8}$')
);
--> statement-breakpoint
CREATE TABLE "document_state" (
	"document_id" text PRIMARY KEY NOT NULL,
	"yjs_state" "bytea" DEFAULT decode('0000', 'hex') NOT NULL,
	"persisted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace" DROP CONSTRAINT "color_hex_value";--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_state" ADD CONSTRAINT "document_state_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_workspace_id_idx" ON "document" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "document_workspace_id_deleted_at_idx" ON "document" USING btree ("workspace_id","deleted_at");--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_color_hex_value" CHECK ("workspace"."color" ~ '^#[0-9A-Fa-f]{8}$');