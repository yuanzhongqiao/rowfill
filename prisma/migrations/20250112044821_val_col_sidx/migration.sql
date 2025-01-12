/*
  Warnings:

  - You are about to drop the column `misc` on the `SheetColumnValue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SheetColumnValue" DROP COLUMN "misc",
ADD COLUMN     "sourceIndexId" TEXT;
