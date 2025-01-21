"use server"

export async function getPricingInfo() {
    if (!process.env.EE_ENABLED || process.env.EE_ENABLED === "false") {
        return {
            ee: false,
            pricing: {
                monthly: "",
                yearly: "",
                credits: ""
            }
        }
    }
    return {
        ee: true,
        pricing: {
            monthly: process.env.PRO_PLAN_PRICE_MONTHLY || "",
            yearly: process.env.PRO_PLAN_PRICE_YEARLY || "",
            credits: process.env.PRO_PLAN_CREDITS || ""
        }
    }
}
