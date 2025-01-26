import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Get API key from Authorization header
        const authHeader = req.headers.get("authorization")
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const apiKey = authHeader.split(" ")[1]
        const organization = await prisma.organization.findFirst({
            where: {
                apiKey: apiKey
            }
        })

        if (!organization) {
            return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
        }

        // Get the sheet
        const sheet = await prisma.sheet.findFirst({
            where: {
                id: params.id,
                organizationId: organization.id
            },
            include: {
                sheetColumns: true
            }
        })

        if (!sheet) {
            return NextResponse.json({ error: "Sheet not found" }, { status: 404 })
        }

        // Verify sheet is single source and extraction is complete
        if (!sheet.singleSource) {
            return NextResponse.json(
                { error: "Sheet must be single source" },
                { status: 400 }
            )
        }

        if (sheet.extractInProgress) {
            return NextResponse.json(
                { error: "Extraction is still in progress" },
                { status: 400 }
            )
        }

        // Get all extracted rows
        const extractedRows = await prisma.extractedSheetRow.findMany({
            where: {
                sheetId: sheet.id,
                organizationId: organization.id
            },
            orderBy: {
                rowNumber: 'asc'
            }
        })

        // Format the response
        const formattedRows = []
        const columnMap = new Map(sheet.sheetColumns.map(col => [col.id, col.name]))

        let currentRow: Record<string, string> = {}
        let currentRowNum = -1

        for (const row of extractedRows) {
            if (currentRowNum !== row.rowNumber) {
                if (currentRowNum !== -1) {
                    formattedRows.push(currentRow)
                }
                currentRow = {}
                currentRowNum = row.rowNumber
            }

            const columnName = columnMap.get(row.sheetColumnId)
            if (columnName) {
                currentRow[columnName] = row.value || ''
            }
        }

        // Push the last row
        if (Object.keys(currentRow).length > 0) {
            formattedRows.push(currentRow)
        }

        return NextResponse.json({ rows: formattedRows })

    } catch (error) {
        console.error("Error in GET /api/v1/sources/[id]/extract/[id]:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}