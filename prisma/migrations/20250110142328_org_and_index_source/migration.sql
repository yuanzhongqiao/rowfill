/*
  Warnings:

  - Added the required column `organizationId` to the `SheetColumn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `SheetColumnValue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `SheetSource` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SheetColumn" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SheetColumnValue" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SheetSource" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "IndexedSource" (
    "id" TEXT NOT NULL,
    "indexId" TEXT NOT NULL,
    "referenceImageNickName" TEXT NOT NULL,
    "referenceImageFileName" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexedSource_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SheetSource" ADD CONSTRAINT "SheetSource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetColumn" ADD CONSTRAINT "SheetColumn_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetColumnValue" ADD CONSTRAINT "SheetColumnValue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexedSource" ADD CONSTRAINT "IndexedSource_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexedSource" ADD CONSTRAINT "IndexedSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexedSource" ADD CONSTRAINT "IndexedSource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
