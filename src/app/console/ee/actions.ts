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
    return [
        {
            name: "FREE",
            price: "$0",
            credits: "1000",
            for: "lifetime",
            purchaseUrl: "",
        },
        {
            name: "PRO_MONTHLY",
            price: `$${process.env.PRO_PLAN_PRICE_MONTHLY}`,
            credits: `${process.env.PRO_PLAN_CREDITS}`,
            for: "monthly",
            purchaseUrl: "", // TODO: Stripe Link
        },
        {
            name: "PRO_YEARLY",
            price: `$${process.env.PRO_PLAN_PRICE_YEARLY}`,
            credits: `${process.env.PRO_PLAN_CREDITS}`,
            for: "yearly",
            purchaseUrl: "", // TODO: Stripe Link
        },
        {
            name: "ENTERPRISE",
            price: "Custom",
            credits: "100000+",
            for: "Contract",
            purchaseUrl: "", // TODO: Calendar Link
        }
    ]
}

export async function handleDowngradeToFree() {
    const { organizationId } = await getAuthToken()

    await prisma.billing.update({
        where: {
            organizationId: organizationId
        },
        data: {
            plan: "FREE"
        }
    })

    return true
}