/*
  Warnings:

  - Added the required column `nickname` to the `Source` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "nickname" TEXT NOT NULL;
