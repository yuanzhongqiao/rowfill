-- DropForeignKey
ALTER TABLE "Sheet" DROP CONSTRAINT "Sheet_createdById_fkey";

-- AlterTable
ALTER TABLE "Sheet" ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
