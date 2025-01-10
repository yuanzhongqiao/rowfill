/*
  Warnings:

  - You are about to drop the column `filename` on the `Source` table. All the data in the column will be lost.
  - You are about to drop the column `nickname` on the `Source` table. All the data in the column will be lost.
  - Added the required column `fileName` to the `Source` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `Source` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nickName` to the `Source` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Source" DROP COLUMN "filename",
DROP COLUMN "nickname",
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "fileType" TEXT NOT NULL,
ADD COLUMN     "nickName" TEXT NOT NULL;
