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

    const sources = await prisma.sheetSource.findMany({
        where: {
            sheetId: sheet.id
        },
        include: {
            source: {
                select: {
                    id: true,
                    nickname: true
                }
            }
        }
    })

    const columns = await prisma.sheetColumn.findMany({
        where: {
            sheetId: sheet.id
        }
    })

    const values = await prisma.sheetColumnValue.findMany({
        where: {
            sheetId: sheet.id
        }
    })

    let columnValues: any = {}

    for (const value of values) {
        columnValues[`${value.sourceId}_${value.columnId}`] = value
    }

    return {
        sheet,
        sources,
        columns,
        columnValues
    }
}

export const updateSheetName = async (id: string, name: string) => {
    const { organizationId, userId } = await getAuthToken()
    await prisma.sheet.update({
        where: {
            id,
            organizationId,
            createdById: userId
        },
        data: { name }
    })
    return
}

export const addSourceToSheet = async (sourceIds: string[], sheetId: string) => {
    const { organizationId } = await getAuthToken()

    const sheet = await prisma.sheet.findFirstOrThrow({
        where: {
            id: sheetId,
            organizationId
        }
    })

    for (const sourceId of sourceIds) {
        const source = await prisma.source.findFirstOrThrow({
            where: {
                id: sourceId,
                organizationId
            }
        })

        await prisma.sheetSource.create({
            data: {
                sourceId: source.id,
                sheetId: sheet.id
            }
        })
    }

    return

}
