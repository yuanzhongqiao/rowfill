-- AlterTable
ALTER TABLE "Sheet" ADD COLUMN     "singleSource" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ExtractedSheetRow" (
    "rowNumber" INTEGER NOT NULL,
    "sheetId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "indexedSourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractedSheetRow_pkey" PRIMARY KEY ("rowNumber","sheetId")
);

-- AddForeignKey
ALTER TABLE "ExtractedSheetRow" ADD CONSTRAINT "ExtractedSheetRow_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedSheetRow" ADD CONSTRAINT "ExtractedSheetRow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedSheetRow" ADD CONSTRAINT "ExtractedSheetRow_indexedSourceId_fkey" FOREIGN KEY ("indexedSourceId") REFERENCES "IndexedSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
