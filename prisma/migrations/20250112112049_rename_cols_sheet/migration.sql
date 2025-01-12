/*
  Warnings:

  - The primary key for the `SheetColumnValue` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `columnId` on the `SheetColumnValue` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `SheetColumnValue` table. All the data in the column will be lost.
  - You are about to drop the column `sourceIndexId` on the `SheetColumnValue` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `SheetColumn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sheetColumnId` to the `SheetColumnValue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sheetSourceId` to the `SheetColumnValue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SheetColumnValue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SheetSource` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SheetColumnValue" DROP CONSTRAINT "SheetColumnValue_columnId_fkey";

-- DropForeignKey
ALTER TABLE "SheetColumnValue" DROP CONSTRAINT "SheetColumnValue_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "SheetColumnValue" DROP CONSTRAINT "SheetColumnValue_sourceIndexId_fkey";

-- AlterTable
ALTER TABLE "SheetColumn" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SheetColumnValue" DROP CONSTRAINT "SheetColumnValue_pkey",
DROP COLUMN "columnId",
DROP COLUMN "sourceId",
DROP COLUMN "sourceIndexId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "indexedSourceId" TEXT,
ADD COLUMN     "sheetColumnId" TEXT NOT NULL,
ADD COLUMN     "sheetSourceId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "SheetColumnValue_pkey" PRIMARY KEY ("sheetColumnId", "sheetSourceId");

-- AlterTable
ALTER TABLE "SheetSource" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "SheetColumnValue" ADD CONSTRAINT "SheetColumnValue_sheetColumnId_fkey" FOREIGN KEY ("sheetColumnId") REFERENCES "SheetColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetColumnValue" ADD CONSTRAINT "SheetColumnValue_sheetSourceId_fkey" FOREIGN KEY ("sheetSourceId") REFERENCES "SheetSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetColumnValue" ADD CONSTRAINT "SheetColumnValue_indexedSourceId_fkey" FOREIGN KEY ("indexedSourceId") REFERENCES "IndexedSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
