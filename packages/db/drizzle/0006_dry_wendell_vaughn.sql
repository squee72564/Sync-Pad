CREATE TYPE "public"."organization_invite_status" AS ENUM('pending', 'accepted', 'declined', 'revoked', 'expired');--> statement-breakpoint
CREATE TABLE "organization_invite" (
	"organization_invite_id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"organization_role" "organization_role" NOT NULL,
	"status" "organization_invite_status" DEFAULT 'pending' NOT NULL,
	"invited_by" text,
	"accepted_by" text,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"declined_at" timestamp,
	"revoked_at" timestamp,
	"last_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invite_email_normalized" CHECK ("organization_invite"."email" = lower(trim("organization_invite"."email"))),
	CONSTRAINT "organization_invite_email_valid" CHECK ("organization_invite"."email" ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);
--> statement-breakpoint
ALTER TABLE "organization_invite" ADD CONSTRAINT "organization_invite_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite" ADD CONSTRAINT "organization_invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite" ADD CONSTRAINT "organization_invite_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_invite_token_hash_unique" ON "organization_invite" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_invite_pending_email_unique" ON "organization_invite" USING btree ("organization_id","email") WHERE "organization_invite"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "organization_invite_organization_id_idx" ON "organization_invite" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_invite_email_idx" ON "organization_invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "organization_invite_invited_by_idx" ON "organization_invite" USING btree ("invited_by");--> statement-breakpoint
CREATE INDEX "organization_invite_accepted_by_idx" ON "organization_invite" USING btree ("accepted_by");--> statement-breakpoint
CREATE INDEX "organization_invite_status_idx" ON "organization_invite" USING btree ("status");