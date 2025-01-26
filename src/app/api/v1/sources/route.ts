import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { getPresignedUrlForUpload } from "@/lib/file"
import axios from "axios"

const createSourceSchema = z.object({
    file: z.instanceof(File)
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

        // Get all sources for the organization
        const sources = await prisma.source.findMany({
            where: { organizationId: organization.id },
        })

        return NextResponse.json(sources)
    } catch (error) {
        console.error("Error in GET /api/v1/sources:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
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

        const formData = await req.formData()
        const file = formData.get('file') as File

        // Validate request body
        const validatedData = createSourceSchema.parse({ file })

        // Generate presigned URL for file upload
        const presignedUrl = await getPresignedUrlForUpload(validatedData.file.name)

        await axios.put(presignedUrl.url, validatedData.file)

        // Create source
        const source = await prisma.source.create({
            data: {
                fileName: presignedUrl.filename,
                fileType: validatedData.file.type,
                organizationId: organization.id,
                isIndexed: false,
                isIndexing: false,
                nickName: validatedData.file.name,
            },
        })

        return NextResponse.json({
            id: source.id
        }, { status: 201 })
    } catch (error) {
        logger.error("Error in POST /api/v1/sources:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
