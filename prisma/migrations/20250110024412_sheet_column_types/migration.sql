/*
  Warnings:

  - Added the required column `dataType` to the `SheetColumn` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instruction` to the `SheetColumn` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `SheetColumn` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ColumnTaskType" AS ENUM ('GENERATION', 'EXTRACTION', 'CLASSIFICATION', 'OTHERS');

-- CreateEnum
CREATE TYPE "ColumnDataType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'TIME', 'BOOLEAN', 'LIST', 'OBJECT');

-- AlterTable
ALTER TABLE "SheetColumn" ADD COLUMN     "dataType" "ColumnDataType" NOT NULL,
ADD COLUMN     "defaultValue" TEXT NOT NULL DEFAULT 'N/A',
ADD COLUMN     "instruction" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "ColumnTaskType" NOT NULL;
