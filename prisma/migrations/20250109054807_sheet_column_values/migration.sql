-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetSource" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "SheetSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetColumn" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "SheetColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetColumnValue" (
    "columnId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "misc" JSONB,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "SheetColumnValue_pkey" PRIMARY KEY ("columnId","sourceId")
);

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetSource" ADD CONSTRAINT "SheetSource_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetSource" ADD CONSTRAINT "SheetSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetColumn" ADD CONSTRAINT "SheetColumn_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "Sheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetColumnValue" ADD CONSTRAINT "SheetColumnValue_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "SheetColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SheetColumnValue" ADD CONSTRAINT "SheetColumnValue_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SheetSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
