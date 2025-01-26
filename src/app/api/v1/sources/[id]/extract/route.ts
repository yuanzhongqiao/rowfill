import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ColumnDataType, ColumnTaskType } from "@prisma/client"
import { queue } from "@/lib/queue"

// Zod schema for column validation
const columnSchema = z.object({
    name: z.string().min(1),
    instruction: z.string().min(1),
    task_type: z.nativeEnum(ColumnTaskType),
    data_type: z.nativeEnum(ColumnDataType),
    default_value: z.string().default("N/A")
})

// Zod schema for request body validation
const createSheetSchema = z.object({
    name: z.string().min(1),
    source_id: z.string().uuid(),
    columns: z.array(columnSchema).min(1)
})


export async function GET(req: NextRequest) {
    try {
        // Get API key from header
        const apiKey = req.headers.get("x-api-key")
        if (!apiKey) {
            return NextResponse.json({ error: "API key required" }, { status: 401 })
        }

        // Get organization
        const organization = await await prisma.organization.findUnique({
            where: { apiKey }
        })

        if (!organization) {
            return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
        }

        // Get all single source sheets
        const sheets = await prisma.sheet.findMany({
            where: {
                organizationId: organization.id,
                singleSource: true
            },
            select: {
                id: true,
                name: true,
                extractInProgress: true
            }
        })

        return NextResponse.json(sheets)

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: error.message === "Invalid API key" ? 401 : 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        // Get API key from header
        const apiKey = req.headers.get("x-api-key")
        if (!apiKey) {
            return NextResponse.json({ error: "API key required" }, { status: 401 })
        }

        // Get organization
        const organization = await await prisma.organization.findUnique({
            where: { apiKey }
        })

        if (!organization) {
            return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
        }

        // Validate request body
        const body = await req.json()
        const validatedData = createSheetSchema.parse(body)

        // Check if source exists and is indexed
        const source = await prisma.source.findFirst({
            where: {
                id: validatedData.source_id,
                organizationId: organization.id,
                isIndexed: true
            }
        })

        if (!source) {
            return NextResponse.json(
                { error: "Source not found or not indexed" },
                { status: 404 }
            )
        }

        // Create sheet and related records in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create sheet
            const sheet = await tx.sheet.create({
                data: {
                    name: validatedData.name,
                    organizationId: organization.id,
                    singleSource: true
                }
            })

            // Create sheet source
            await tx.sheetSource.create({
                data: {
                    sourceId: source.id,
                    sheetId: sheet.id,
                    organizationId: organization.id
                }
            })

            // Create columns
            for (const column of validatedData.columns) {
                await tx.sheetColumn.create({
                    data: {
                        name: column.name,
                        instruction: column.instruction,
                        taskType: column.task_type,
                        dataType: column.data_type,
                        defaultValue: column.default_value,
                        sheetId: sheet.id,
                        organizationId: organization.id
                    }
                })
            }

            return sheet
        })

        // Start extraction process
        await queue.add("extractTableToSheet", { sheetId: result.id })

        return NextResponse.json({
            sheet_id: result.id,
            status: "scheduled_for_extraction"
        }, {
            status: 201
        })

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: error.message === "Invalid API key" ? 401 : 500 }
        )
    }
}
