ALTER TABLE "organization_membership" DROP CONSTRAINT "organization_membership_invited_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "organization_membership" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DELETE FROM "organization_membership" WHERE "status" = 'invited';--> statement-breakpoint
DROP TYPE "public"."organization_membership_status";--> statement-breakpoint
CREATE TYPE "public"."organization_membership_status" AS ENUM('active', 'suspended');--> statement-breakpoint
ALTER TABLE "organization_membership" ALTER COLUMN "status" SET DATA TYPE "public"."organization_membership_status" USING "status"::"public"."organization_membership_status";--> statement-breakpoint
ALTER TABLE "organization_membership" DROP COLUMN "invited_by";
