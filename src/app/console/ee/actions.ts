"use server"

import { getAuthToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getBillingAndCreateIfNotExists() {
    const { organizationId } = await getAuthToken()

    const cloudHosted = process.env.EE_ENABLED && process.env.EE_ENABLED === "true"

    if (!cloudHosted) {
        return null
    }

    let billing = await prisma.billing.findFirst({
        where: {
            organizationId: organizationId
        }
    })

    if (!billing && process.env.EE_ENABLED && process.env.EE_ENABLED === "true") {
        await prisma.billing.create({
            data: {
                organizationId: organizationId
            }
        })

        billing = await prisma.billing.findFirst({
            where: {
                organizationId: organizationId
            }
        })
    }

    return billing
}

export async function getPlans() {

    const cloudHosted = process.env.EE_ENABLED && process.env.EE_ENABLED === "true"

    if (!cloudHosted) {
        return []
    }

    // TODO: Implement plans
    return []
}
