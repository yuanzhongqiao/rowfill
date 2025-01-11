-- AlterTable
ALTER TABLE "IndexedSource" ADD COLUMN     "referenceText" TEXT,
ALTER COLUMN "referenceImageFileName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "isIndexing" BOOLEAN NOT NULL DEFAULT false;
