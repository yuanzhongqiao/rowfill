/*
  Warnings:

  - You are about to drop the column `sheetId` on the `IndexedSource` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "IndexedSource" DROP CONSTRAINT "IndexedSource_sheetId_fkey";

-- AlterTable
ALTER TABLE "IndexedSource" DROP COLUMN "sheetId";
