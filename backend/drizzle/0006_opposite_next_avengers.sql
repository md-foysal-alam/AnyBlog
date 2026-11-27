DROP INDEX "otp_codes_account_purpose_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "otp_codes_account_purpose_idx" ON "otp_codes" USING btree ("account_id","purpose");--> statement-breakpoint
ALTER TABLE "otp_codes" DROP COLUMN "used_at";