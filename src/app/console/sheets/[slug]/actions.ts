"use server"

import { prisma } from "@/lib/prisma"
import { getAuthToken } from "@/lib/auth"
import { ColumnDataType, ColumnTaskType } from "@prisma/client"
import { queryVectorDB } from "@/core/memory"
import { generateAnswer } from "@/core/answer"
import { getPresignedUrlForGet } from "@/lib/file"

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

        for (const sheetSource of sheetSources) {
            await tx.sheetColumnValue.create({
                data: {
                    sourceId: sheetSource.id,
                    columnId: column.id,
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


export async function deleteSheet(sheetId: string) {
    const { organizationId, userId } = await getAuthToken()

    await prisma.$transaction(async (tx) => {
        await tx.sheetColumnValue.deleteMany({
            where: {
                sheetId: sheetId,
                organizationId
            }
        })

        await tx.sheetSource.deleteMany({
            where: {
                sheetId: sheetId,
                organizationId
            }
        })


        await tx.sheetColumn.deleteMany({
            where: {
                sheetId: sheetId,
                organizationId
            }
        })

        await prisma.sheet.delete({
            where: {
                id: sheetId,
                organizationId,
                createdById: userId
            }
        })
    })

    return
}


export async function runColumnSourceTask(sheetId: string, sheetColumnId: string, sheetSourceId: string) {
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
            id: sheetColumnId,
            sheetId: sheet.id,
            organizationId
        }
    })

    const sheetSource = await prisma.sheetSource.findFirstOrThrow({
        where: {
            id: sheetSourceId,
            sheetId: sheet.id,
            organizationId
        }
    })

    const sourceIndexes = await prisma.indexedSource.findMany({
        where: {
            sourceId: sheetSource.sourceId,
            organizationId
        }
    })

    if (sourceIndexes.length === 0) {
        throw new Error("No source indexes found")
    }

    let data = ""
    let refrenceImage = ""
    let sourceIndexId = ""

    if (sourceIndexes.length > 1) {
        const foundIndex = await queryVectorDB(column.instruction, organizationId, sheetSource.sourceId)
        const sourceIndex = sourceIndexes.find(index => index.indexId === foundIndex)
        if (sourceIndex) {
            data = sourceIndex.referenceText || ""
            refrenceImage = sourceIndex.referenceImageFileName || ""
            sourceIndexId = sourceIndex.indexId || ""
        }
    } else {
        data = sourceIndexes[0].referenceText || ""
        refrenceImage = sourceIndexes[0].referenceImageFileName || ""
        sourceIndexId = sourceIndexes[0].indexId || ""
    }

    let query = `
    Based on the ${column.instruction}\n
    ${data ? `From the following data: ${data}\n` : ""}
    You need to perform the following task:\n
    ${column.taskType}\n
    Output the answer in the following format:\n
    ${column.dataType}\n
    `

    // Get presigned url for the image
    if (refrenceImage) {
        const imageFromBucket = await getPresignedUrlForGet(refrenceImage)
        refrenceImage = imageFromBucket.url
    }

    const answer = await generateAnswer(query, refrenceImage ? [refrenceImage] : [])

    await prisma.sheetColumnValue.updateMany({
        where: {
            columnId: sheetColumnId,
            sourceId: sheetSourceId,
            sheetId: sheet.id,
            organizationId
        },
        data: {
            value: answer,
            sourceIndexId: sourceIndexId
        }
    })

    return {
        answer,
        sourceIndexId
    }

}


export async function getSourceIndex(sourceIndexId: string) {
    const { organizationId } = await getAuthToken()

    let sourceIndex = await prisma.indexedSource.findFirstOrThrow({
        where: {
            id: sourceIndexId,
            organizationId
        },
        include: {
            source: true
        }
    })

    if (sourceIndex.referenceImageFileName) {
        const imageFromBucket = await getPresignedUrlForGet(sourceIndex.referenceImageFileName)
        sourceIndex.referenceImageFileName = imageFromBucket.url
    }

    if (sourceIndex.source.fileName) {
        const fileFromBucket = await getPresignedUrlForGet(sourceIndex.source.fileName)
        sourceIndex.source.fileName = fileFromBucket.url
    }

    return sourceIndex
}
