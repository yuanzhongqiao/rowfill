import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { queryVectorDB } from "@/core/memory"
import { getPresignedUrlForGet } from "@/lib/file"
import { generateAnswer } from "@/core/answer"

// Define the query parameters schema
const QueryParamsSchema = z.object({
    query: z.string().min(1, "Query is required"),
    source_id: z.string().optional()
})

export async function GET(req: NextRequest) {
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

        // Get and validate query parameters
        const url = new URL(req.url)
        const queryParams = {
            query: url.searchParams.get("query"),
            source_id: url.searchParams.get("source_id")
        }

        const result = QueryParamsSchema.safeParse(queryParams)

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid parameters", details: result.error.issues },
                { status: 400 }
            )
        }

        // Continue with the validated parameters
        const { query, source_id } = result.data

        const documentId = await queryVectorDB(query, organization.id, source_id)

        if (!documentId) {
            return NextResponse.json({ error: "No documents found" }, { status: 404 })
        }

        let sourceIndex = await prisma.indexedSource.findFirstOrThrow({
            where: {
                indexId: documentId,
                organizationId: organization.id
            }
        })

        // Get presigned url for the image
        if (sourceIndex.referenceImageFileName) {
            sourceIndex.referenceImageFileName = (await getPresignedUrlForGet(sourceIndex.referenceImageFileName)).url
        }

        const preparedQuery = `
        Answer the question: ${query}
        ${sourceIndex.referenceText && `Based on the following data: ${sourceIndex.referenceText}`}
        `

        const answer = await generateAnswer(preparedQuery, sourceIndex.referenceImageFileName ? [sourceIndex.referenceImageFileName] : [])

        return NextResponse.json({
            answer: answer,
            reference_text: sourceIndex.referenceText,
            reference_image: sourceIndex.referenceImageFileName
        })

    } catch (error) {
        console.error("Error in GET /api/v1/sources:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}