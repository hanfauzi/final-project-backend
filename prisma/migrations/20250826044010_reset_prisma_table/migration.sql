/*
  Warnings:

  - The `label` column on the `customer_addresses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `open_hour` on the `outlet_schedules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `close_hour` on the `outlet_schedules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `start_time` on the `shifts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `end_time` on the `shifts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."Label" AS ENUM ('HOME', 'OFFICE', 'APARTMENT', 'OTHER');

-- AlterTable
ALTER TABLE "public"."customer_addresses" DROP COLUMN "label",
ADD COLUMN     "label" "public"."Label" NOT NULL DEFAULT 'HOME';

-- AlterTable
ALTER TABLE "public"."outlet_schedules" DROP COLUMN "open_hour",
ADD COLUMN     "open_hour" TIMESTAMP NOT NULL,
DROP COLUMN "close_hour",
ADD COLUMN     "close_hour" TIMESTAMP NOT NULL;

-- AlterTable
ALTER TABLE "public"."shifts" DROP COLUMN "start_time",
ADD COLUMN     "start_time" TIMESTAMP NOT NULL,
DROP COLUMN "end_time",
ADD COLUMN     "end_time" TIMESTAMP NOT NULL;
