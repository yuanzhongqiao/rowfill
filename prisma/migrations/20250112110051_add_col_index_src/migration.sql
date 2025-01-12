-- AddForeignKey
ALTER TABLE "SheetColumnValue" ADD CONSTRAINT "SheetColumnValue_sourceIndexId_fkey" FOREIGN KEY ("sourceIndexId") REFERENCES "IndexedSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
