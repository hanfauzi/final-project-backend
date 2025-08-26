/*
  Warnings:

  - Added the required column `note` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."order_items" ADD COLUMN     "note" TEXT NOT NULL;
