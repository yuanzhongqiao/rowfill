"use client"

import { Billing } from "@prisma/client"
import { useEffect, useState } from "react"
import { getBillingAndCreateIfNotExists, getPlans, handleDowngradeToFree } from "./actions"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function BillingComponent({ billingState }: { billingState: Billing }) {

    type Plan = {
        name: string
        price: string
        credits: string
        for: string
        purchaseUrl: string
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

    const planButtonText = (plan: Plan) => {
        if (billing && billing.plan === plan.name) {
            return "Current Plan"
        }

        if (billing && billing.plan === "PRO" && plan.name === "FREE") {
            return "Downgrade"
        }

        if (billing && billing.plan === "FREE" && plan.name.includes("PRO_")) {
            return "Upgrade"
        }

        if (billing && billing.plan === "ENTERPRISE") {
            return "Contact Support"
        }

        return "Contact Support"
    }

    const handlePlanButton = async (plan: Plan) => {
        if (billing && billing.plan === "FREE" && plan.name !== "FREE") {
            router.push(plan.purchaseUrl)
            return
        }

        if (billing && (billing.plan === "FREE" || billing.plan === "PRO") && plan.name === "ENTERPRISE") {
            router.push(plan.purchaseUrl)
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
                            disabled={planButtonText(plan) === "Current Plan"}
                            onClick={
                                () => planButtonText(plan) === "Contact Support" ?
                                    window.location.href = "mailto:support@rowfill.com" :
                                    handlePlanButton(plan)
                            }
                        >
                            {planButtonText(plan)}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
