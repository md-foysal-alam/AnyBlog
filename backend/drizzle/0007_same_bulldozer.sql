DROP INDEX "otp_codes_account_purpose_idx";--> statement-breakpoint
CREATE INDEX "comments_author_idx" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "email_verifications_expires_idx" ON "email_verifications" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "otp_codes_account_purpose_unique" ON "otp_codes" USING btree ("account_id","purpose");--> statement-breakpoint
CREATE INDEX "posts_published_at_idx" ON "posts" USING btree ("published_at");