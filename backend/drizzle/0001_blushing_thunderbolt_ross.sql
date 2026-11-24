ALTER TABLE "users" ADD COLUMN "first_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" "cal::local_datetime" DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";