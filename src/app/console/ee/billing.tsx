"use client"

import { Billing } from "@prisma/client"
import { useEffect, useState } from "react"
import { getBillingAndCreateIfNotExists, getPaddle, getPlans, handleDowngradeToFree } from "./actions"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { initializePaddle } from "@paddle/paddle-js"


export default function BillingComponent({ billingState }: { billingState: Billing }) {

    type Plan = {
        name: string
        price: string
        credits: string
        for: string
        priceId?: string
        calendarUrl?: string
        buttonText: string
    }

    const [billing, setBilling] = useState<Billing>(billingState)
    const [plans, setPlans] = useState<Plan[]>([])
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const plans = await getPlans()
        setPlans(plans)
    }

    const fetchBilling = async () => {
        const billing = await getBillingAndCreateIfNotExists()
        if (billing) {
            setBilling(billing)
        }
    }

    const handlePlanButton = async (plan: Plan) => {
        if (billing && billing.plan === "FREE" && plan.name !== "FREE") {
            const paddleSettings = await getPaddle()
            const paddle = await initializePaddle(paddleSettings)
            if (paddle) {
                paddle.Checkout.open({
                    customer: {
                        id: billing.thirdPartyId as string
                    },
                    items: [{
                        priceId: plan.priceId || "",
                        quantity: 1
                    }]
                })
            }
            return
        }

        if (billing && (billing.plan === "FREE" || billing.plan === "PRO") && plan.name === "ENTERPRISE") {
            router.push(plan.calendarUrl || "#")
            return
        }

        if (billing && (billing.plan.includes("PRO_")) && plan.name === "FREE") {
            // Handle Downgrade
            await handleDowngradeToFree()
            await fetchBilling()
            toast({
                title: "Downgraded to Free",
                description: "You have been downgraded to the Free plan",
            })
            return
        }


        toast({
            title: "Failed to update plan",
            description: "Please contact support",
            variant: "destructive",
        })
    }

    return (
        <div>
            <p className="text-lg font-bold mt-5">Available Credits: {billing.credits}</p>
            <div className="space-y-3 mt-2">
                {plans.map((plan, index) => (
                    <div key={`plan-${index}`} className="flex justify-between items-center p-5 rounded-md border-[1px] border-gray-200">
                        <div className="flex flex-col gap-1">
                            <p className="flex items-center gap-2 font-bold">{plan.price} / {plan.for}</p>
                            <p>{plan.name}</p>
                            <p className="text-sm">{plan.credits} Credits / month</p>
                        </div>
                        <Button
                            className="w-[150px]"
                            disabled={plan.buttonText === "Current Plan"}
                            onClick={() => handlePlanButton(plan)}
                        >
                            {plan.buttonText}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
