"use server"

import { prisma } from "@/lib/prisma"
import { getAuthToken } from "@/lib/auth"
import { ColumnDataType, ColumnTaskType, ExtractedSheetRow, SheetColumnValue } from "@prisma/client"
import { queryVectorDB } from "@/core/memory"
import { generateAnswer } from "@/core/answer"
import { getPresignedUrlForGet } from "@/lib/file"
import { queue } from "@/lib/queue"
import { checkCredits, consumeCredits } from "@/core/ee/billing"

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


    let columnValues: { [key: string]: SheetColumnValue } = {}
    let extractedSheetRows: { [key: string]: ExtractedSheetRow } = {}
    let extractedMaximumRowNumber = 0

    if (!sheet.singleSource) {
        const values = await prisma.sheetColumnValue.findMany({
            where: {
                sheetId: sheet.id,
                organizationId
            }
        })


        for (const value of values) {
            columnValues[`${value.sheetSourceId}_${value.sheetColumnId}`] = value
        }
    }


    if (sheet.singleSource) {
        let rowVals = await prisma.extractedSheetRow.findMany({
            where: {
                sheetId: sheet.id,
                organizationId
            }
        })

        extractedMaximumRowNumber = rowVals.reduce((max, row) => Math.max(max, row.rowNumber), 0)

        for (let row of rowVals) {
            extractedSheetRows[`${row.rowNumber}_${row.sheetColumnId}`] = row
        }



    }

    return {
        sheet,
        sources,
        columns,
        columnValues,
        extractedSheetRows,
        extractedMaximumRowNumber
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

export const updateSourceToSheet = async (selectedSourceIds: string[], sheetId: string) => {
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
    const newSourceIds = selectedSourceIds.filter(sourceId => !existingSheetSourceIds.includes(sourceId))

    // Find source ids that are present in sheetSourceIds but not in sourceIds
    const oldSourceIds = existingSheetSourceIds.filter(sourceId => !selectedSourceIds.includes(sourceId))


    for (const sourceId of newSourceIds) {
        await prisma.$transaction(async (tx) => {
            const source = await tx.source.findFirstOrThrow({
                where: {
                    id: sourceId,
                    organizationId
                }
            })

            const sheetSource = await tx.sheetSource.create({
                data: {
                    sourceId: source.id,
                    sheetId: sheet.id,
                    organizationId
                }
            })

            if (!sheet.singleSource) {
                const sheetColumns = await tx.sheetColumn.findMany({
                    where: {
                        sheetId: sheet.id,
                        organizationId
                    }
                })

                for (const sheetColumn of sheetColumns) {
                    await tx.sheetColumnValue.create({
                        data: {
                            sheetSourceId: sheetSource.id,
                            sheetColumnId: sheetColumn.id,
                            value: "",
                            sheetId: sheet.id,
                            organizationId
                        }
                    })
                }
            }
        })
    }

    for (const sourceId of oldSourceIds) {

        await prisma.$transaction(async (tx) => {

            if (!sheet.singleSource) {
                const sheetSource = await tx.sheetSource.findFirstOrThrow({
                    where: {
                        sourceId: sourceId,
                        sheetId: sheet.id,
                        organizationId
                    }
                })

                await tx.sheetColumnValue.deleteMany({
                    where: {
                        sheetSourceId: sheetSource.id,
                        sheetId: sheet.id,
                        organizationId
                    }
                })
            }

            await tx.sheetSource.deleteMany({
                where: {
                    sourceId: sourceId,
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

        const sheetColumn = await tx.sheetColumn.create({
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

        if (!sheet.singleSource) {
            const sheetSources = await tx.sheetSource.findMany({
                where: {
                    sheetId: sheet.id
                }
            })

            for (const sheetSource of sheetSources) {
                await tx.sheetColumnValue.create({
                    data: {
                        sheetSourceId: sheetSource.id,
                        sheetColumnId: sheetColumn.id,
                        sheetId: sheet.id,
                        organizationId
                    }
                })
            }
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


export async function deleteColumnFromSheet(sheetId: string, sheetColumnId: string) {
    const { organizationId, userId } = await getAuthToken()
    const sheet = await prisma.sheet.findFirstOrThrow({
        where: {
            id: sheetId,
            organizationId,
            createdById: userId
        }
    })

    const sheetColumn = await prisma.sheetColumn.findFirstOrThrow({
        where: {
            id: sheetColumnId,
            sheetId: sheetId,
            organizationId
        }
    })

    await prisma.$transaction(async (tx) => {

        await tx.extractedSheetRow.deleteMany({
            where: {
                sheetColumnId: sheetColumn.id,
                sheetId: sheet.id,
                organizationId
            }
        })

        await tx.sheetColumnValue.deleteMany({
            where: {
                sheetColumnId: sheetColumn.id,
                sheetId: sheet.id,
                organizationId
            }
        })

        await prisma.sheetColumn.delete({
            where: {
                id: sheetColumn.id,
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

        await tx.extractedSheetRow.deleteMany({
            where: {
                sheetId: sheetId,
                organizationId
            }
        })

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

    if (process.env.EE_ENABLED && process.env.EE_ENABLED === "true") {
        const creditsAvailable = await checkCredits(organizationId, 1)
        if (!creditsAvailable) {
            throw new Error("No credits available")
        }
    }

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
    let indexedSourceId = ""

    if (sourceIndexes.length > 1) {
        const foundIndex = await queryVectorDB(column.instruction, organizationId, sheetSource.sourceId)
        const sourceIndex = sourceIndexes.find(index => index.indexId === foundIndex)
        if (sourceIndex) {
            data = sourceIndex.referenceText || ""
            refrenceImage = sourceIndex.referenceImageFileName || ""
            indexedSourceId = sourceIndex.id || ""
        }
    } else {
        data = sourceIndexes[0].referenceText || ""
        refrenceImage = sourceIndexes[0].referenceImageFileName || ""
        indexedSourceId = sourceIndexes[0].id || ""
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
            sheetColumnId: sheetColumnId,
            sheetSourceId: sheetSourceId,
            sheetId: sheet.id,
            organizationId
        },
        data: {
            value: answer,
            indexedSourceId: indexedSourceId
        }
    })

    if (process.env.EE_ENABLED && process.env.EE_ENABLED === "true") {
        await consumeCredits(organizationId, 1)
    }

    return {
        answer,
        indexedSourceId: indexedSourceId
    }

}

export async function extractDataFromSourceToSheet(sheetId: string) {
    const { organizationId, userId } = await getAuthToken()

    // TODO: Needs to be implemented
    await prisma.sheet.update({
        where: {
            id: sheetId,
            organizationId,
            createdById: userId
        },
        data: {
            extractInProgress: true
        }
    })

    await queue.add("extractTableToSheet", { sheetId })

    return
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