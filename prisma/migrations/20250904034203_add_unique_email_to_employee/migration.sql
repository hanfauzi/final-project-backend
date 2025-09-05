/*
  Warnings:

  - You are about to drop the column `is_provider` on the `customers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."customers" DROP COLUMN "is_provider",
ADD COLUMN     "pending_email" TEXT,
ADD COLUMN     "pending_email_token" TEXT,
ADD COLUMN     "pending_email_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "reset_password_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "select_provider" "public"."oauth_provider",
ADD COLUMN     "verify_token" TEXT,
ADD COLUMN     "verify_token_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "public"."employees"("email");
