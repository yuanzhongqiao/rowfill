/*
  Warnings:

  - Added the required column `sheetId` to the `SheetColumnValue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SheetColumnValue" ADD COLUMN     "sheetId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "SheetColumnValue" ADD CONSTRAINT "SheetColumnValue_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
