"use server"

import { getAuthToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Environment, Paddle } from "@paddle/paddle-node-sdk"

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

    if (!billing) {

        // Find the admin of the org
        const admin = await prisma.member.findFirst({
            where: {
                organizationId: organizationId,
                role: "ADMIN"
            },
            include: {
                organization: true,
                user: true
            }
        })

        if (!admin) {
            return null
        }

        const paddle = new Paddle(process.env.PADDLE_CLIENT_SECRET || "", {
            environment: process.env.PADDLE_MODE === "production" ? Environment.production : Environment.sandbox
        })

        let customerId = ""

        const customers = await paddle.customers.list({
            email: [admin.user.email]
        }).next()

        if (!customers || customers.length === 0) {
            const customer = await paddle.customers.create({
                name: admin.organization.name,
                email: admin.user.email
            })
            customerId = customer.id
        } else {
            customerId = customers[0].id
        }

        await prisma.billing.create({
            data: {
                organizationId: organizationId,
                thirdPartyId: customerId
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


export async function getPaddle() {

    const cloudHosted = process.env.EE_ENABLED && process.env.EE_ENABLED === "true"

    if (!cloudHosted) {
        return {
            token: "",
            environment: Environment.sandbox
        }
    }

    return {
        token: process.env.PADDLE_CLIENT_KEY || "",
        environment: process.env.PADDLE_MODE === "production" ? Environment.production : Environment.sandbox
    }
}

export async function getPlans() {

    const cloudHosted = process.env.EE_ENABLED && process.env.EE_ENABLED === "true"

    if (!cloudHosted) {
        return []
    }

    const { userId, organizationId } = await getAuthToken()

    const member = await prisma.member.findFirst({
        where: {
            userId: userId,
            organizationId: organizationId,
            role: "ADMIN"
        }
    })

    if (!member) {
        return []
    }


    const billing = await prisma.billing.findFirst({
        where: {
            organizationId: organizationId
        }
    })

    if (!billing) {
        return []
    }


    // TODO: Implement plans
    let plans = [
        {
            name: "FREE",
            price: "$0",
            credits: "1000",
            for: "lifetime",
            buttonText: billing.plan === "FREE" ? "Current Plan" : "Upgrade"
        },
        {
            name: "PRO_MONTHLY",
            price: `$${process.env.PRO_PLAN_PRICE_MONTHLY}`,
            credits: `${process.env.PRO_PLAN_CREDITS}`,
            for: "monthly",
            priceId: process.env.PRO_PLAN_PRICE_ID_MONTHLY || "PRO",
            buttonText: billing.plan === "PRO" ? "Current Plan" : "Upgrade"
        },
        {
            name: "PRO_YEARLY",
            price: `$${process.env.PRO_PLAN_PRICE_YEARLY}`,
            credits: `${process.env.PRO_PLAN_CREDITS}`,
            for: "yearly",
            priceId: process.env.PRO_PLAN_PRICE_ID_YEARLY || "PRO",
            buttonText: billing.plan === "PRO" ? "Current Plan" : "Upgrade"
        },
        {
            name: "ADDITIONAL_CREDITS",
            price: `$${process.env.ADDITIONAL_CREDITS_PRICE}`,
            credits: `${process.env.ADDITIONAL_CREDITS_QTY}`,
            for: "lifetime",
            priceId: process.env.ADDITIONAL_CREDITS_PRICE_ID || "ADDITIONAL_CREDITS",
            buttonText: billing.plan === "PRO" ? "Current Plan" : "Upgrade"
        },
        {
            name: "ENTERPRISE",
            price: "Custom",
            credits: "100000+",
            for: "Contract",
            calendarUrl: process.env.ENTERPRISE_CALENDAR_URL || "",
            buttonText: billing.plan === "ENTERPRISE" ? "Current Plan" : "Contact Support"
        }
    ]

    if (billing.plan === "FREE") {
        plans = plans.filter(plan => plan.name !== "ADDITIONAL_CREDITS")
    }

    return plans

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
