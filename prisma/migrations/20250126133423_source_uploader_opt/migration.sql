-- DropForeignKey
ALTER TABLE "Source" DROP CONSTRAINT "Source_uploadedById_fkey";

-- AlterTable
ALTER TABLE "Source" ALTER COLUMN "uploadedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
