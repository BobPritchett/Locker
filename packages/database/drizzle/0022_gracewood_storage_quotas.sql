ALTER TABLE "users" ALTER COLUMN "storage_limit" SET DEFAULT 53687091200;
--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "storage_limit" SET DEFAULT 53687091200;
--> statement-breakpoint
UPDATE "users" SET "storage_limit" = 53687091200 WHERE "storage_limit" = 5368709120;
--> statement-breakpoint
UPDATE "workspaces" SET "storage_limit" = 53687091200 WHERE "storage_limit" = 5368709120;
