"use server"

import { prisma } from "@/lib/prisma"
import { getAuthToken } from "@/lib/auth"
import { ColumnDataType, ColumnTaskType } from "@prisma/client"

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
            sheetId: sheet.id,
            organizationId
        },
        include: {
            source: {
                select: {
                    id: true,
                    nickName: true
                }
            }
        }
    })

    const columns = await prisma.sheetColumn.findMany({
        where: {
            sheetId: sheet.id,
            organizationId
        }
    })

    const values = await prisma.sheetColumnValue.findMany({
        where: {
            sheetId: sheet.id,
            organizationId
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

export const fetchSheetSources = async (sheetId: string) => {
    const { organizationId, userId } = await getAuthToken()
    const sheet = await prisma.sheet.findFirstOrThrow({
        where: {
            id: sheetId,
            organizationId,
            createdById: userId
        }
    })
    return await prisma.sheetSource.findMany({
        where: { sheetId: sheet.id }
    })
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

export const updateSourceToSheet = async (sourceIds: string[], sheetId: string) => {
    const { organizationId, userId } = await getAuthToken()

    const sheet = await prisma.sheet.findFirstOrThrow({
        where: {
            id: sheetId,
            organizationId,
            createdById: userId
        }
    })

    const sheetSources = await prisma.sheetSource.findMany({
        where: {
            sheetId: sheet.id,
            organizationId
        }
    })

    // Existing sheet sources
    const existingSheetSourceIds = sheetSources.map(source => source.sourceId)

    // Find source ids that are present in sourceIds but not in sheetSourceIds
    const newSourceIds = sourceIds.filter(sourceId => !existingSheetSourceIds.includes(sourceId))

    // Find source ids that are present in sheetSourceIds but not in sourceIds
    const oldSourceIds = existingSheetSourceIds.filter(sourceId => !sourceIds.includes(sourceId))


    for (const sourceId of newSourceIds) {
        await prisma.$transaction(async (tx) => {
            const source = await tx.source.findFirstOrThrow({
                where: {
                    id: sourceId,
                    organizationId
                }
            })

            await tx.sheetSource.create({
                data: {
                    sourceId: source.id,
                    sheetId: sheet.id,
                    organizationId
                }
            })

            const columns = await tx.sheetColumn.findMany({
                where: {
                    sheetId: sheet.id,
                    organizationId
                }
            })

            for (const column of columns) {
                await tx.sheetColumnValue.create({
                    data: {
                        sourceId: source.id,
                        columnId: column.id,
                        value: "",
                        sheetId: sheet.id,
                        organizationId
                    }
                })
            }
        })
    }

    for (const sourceId of oldSourceIds) {

        await prisma.$transaction(async (tx) => {

            const source = await tx.source.findFirstOrThrow({
                where: {
                    id: sourceId,
                    organizationId
                }
            })


            await tx.sheetSource.deleteMany({
                where: {
                    sourceId: source.id,
                    sheetId: sheet.id,
                    organizationId
                }
            })

            await tx.sheetColumnValue.deleteMany({
                where: {
                    sourceId: source.id,
                    sheetId: sheet.id,
                    organizationId
                }
            })

        })
    }

    return

}


export async function addColumnToSheet(
    sheetId: string,
    name: string,
    instruction: string,
    taskType: ColumnTaskType,
    dataType: ColumnDataType,
    defaultValue: string
) {
    const { organizationId, userId } = await getAuthToken()

    const sheet = await prisma.sheet.findFirstOrThrow({
        where: {
            id: sheetId,
            organizationId,
            createdById: userId
        }
    })

    await prisma.$transaction(async (tx) => {

        const column = await tx.sheetColumn.create({
            data: {
                sheetId: sheet.id,
                organizationId,
                name,
                instruction,
                taskType,
                dataType,
                defaultValue
            }
        })

        const sheetSources = await tx.sheetSource.findMany({
            where: {
                sheetId: sheet.id
            }
        })

        for (const source of sheetSources) {
            await tx.sheetColumnValue.create({
                data: {
                    sourceId: source.sourceId,
                    columnId: column.id,
                    value: "",
                    sheetId: sheet.id,
                    organizationId
                }
            })
        }

    })

    return
}


export async function updateColumnToSheet(
    sheetId: string,
    columnId: string,
    name: string,
    instruction: string,
    taskType: ColumnTaskType,
    dataType: ColumnDataType,
    defaultValue: string
) {
    const { organizationId, userId } = await getAuthToken()

    const sheet = await prisma.sheet.findFirstOrThrow({
        where: {
            id: sheetId,
            organizationId,
            createdById: userId
        }
    })

    await prisma.sheetColumn.update({
        where: {
            id: columnId,
            sheetId: sheet.id,
            organizationId
        },
        data: {
            name,
            instruction,
            taskType,
            dataType,
            defaultValue
        }
    })

    return
}


export async function deleteColumnFromSheet(sheetId: string, columnId: string) {
    const { organizationId, userId } = await getAuthToken()
    const sheet = await prisma.sheet.findFirstOrThrow({
        where: {
            id: sheetId,
            organizationId,
            createdById: userId
        }
    })

    const column = await prisma.sheetColumn.findFirstOrThrow({
        where: {
            id: columnId,
            sheetId: sheetId,
            organizationId
        }
    })

    await prisma.$transaction(async (tx) => {

        await prisma.sheetColumn.delete({
            where: {
                id: column.id,
                sheetId: sheet.id,
                organizationId
            }
        })

        await tx.sheetColumnValue.deleteMany({
            where: {
                columnId: column.id,
                sheetId: sheet.id,
                organizationId
            }
        })

    })


    return
}
