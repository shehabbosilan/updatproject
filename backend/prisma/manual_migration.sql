-- DropIndex
DROP INDEX IF EXISTS "tenants_email_key";

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "deleted",
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "restored_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "restored_count" INTEGER NOT NULL DEFAULT 0;

-- CreatePartialIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_email_active_idx" ON "tenants"("email") WHERE ("is_deleted" = false);
