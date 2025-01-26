import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const { id } = await params

        // Get source by ID and verify it belongs to the organization
        const source = await prisma.source.findFirst({
            where: {
                id: id,
                organizationId: organization.id
            },
        })

        if (!source) {
            return NextResponse.json({ error: "Source not found" }, { status: 404 })
        }

        return NextResponse.json(source)
    } catch (error) {
        logger.error("Error in GET /api/v1/sources/[id]:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
