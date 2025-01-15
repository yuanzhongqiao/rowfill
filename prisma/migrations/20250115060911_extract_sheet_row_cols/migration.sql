/*
  Warnings:

  - The primary key for the `ExtractedSheetRow` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `sheetColumnId` to the `ExtractedSheetRow` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExtractedSheetRow" DROP CONSTRAINT "ExtractedSheetRow_pkey",
ADD COLUMN     "sheetColumnId" TEXT NOT NULL,
ADD CONSTRAINT "ExtractedSheetRow_pkey" PRIMARY KEY ("rowNumber", "sheetColumnId");

-- AddForeignKey
ALTER TABLE "ExtractedSheetRow" ADD CONSTRAINT "ExtractedSheetRow_sheetColumnId_fkey" FOREIGN KEY ("sheetColumnId") REFERENCES "SheetColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
