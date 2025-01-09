"use server"

import { prisma } from "@/lib/prisma"
import { getAuthToken } from "@/lib/auth"

export const fetchSheet = async (id: string) => {
    const { organizationId, userId } = await getAuthToken()
    const sheet = await prisma.sheet.findFirstOrThrow({
        where: {
            id,
            organizationId,
            createdById: userId
        }
    })
    return sheet
}
