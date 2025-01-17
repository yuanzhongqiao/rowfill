"use client"

import { Billing } from "@prisma/client"
import { useEffect, useState } from "react"
import { getBillingAndCreateIfNotExists, getPlans } from "./actions"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function BillingComponent() {

    type Plan = {
        name: string
        price: number
        credits: number
        purchaseUrl: string
    }

    const [billing, setBilling] = useState<Billing | null>(null)
    const [plans, setPlans] = useState<Plan[]>([])
    const { toast } = useToast()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const billing = await getBillingAndCreateIfNotExists()
        const plans = await getPlans()
        setBilling(billing)
        setPlans(plans)
    }

    const planButtonText = (plan: Plan) => {
        if (billing && billing.plan === plan.name) {
            return "Current Plan"
        }

        if (billing && billing.plan === "PRO" && plan.name === "FREE") {
            return "Downgrade"
        }

        if (billing && billing.plan === "FREE" && plan.name === "PRO") {
            return "Upgrade"
        }

        if (billing && billing.plan === "ENTERPRISE") {
            return "Contact Support"
        }

        return "Contact Support"
    }

    const handlePlanButton = (plan: Plan) => {
        if (billing && billing.plan === "FREE" && plan.name === "PRO") {
            window.open(plan.purchaseUrl, "_blank")
            return
        }

        if (plan.name === "ENTERPRISE") {
            // TODO: Calendar Link
        }

        toast({
            title: "Failed to update plan",
            description: "Please contact support",
            variant: "destructive",
        })
    }

    return (
        <div>
            {/* TODO: Billing goes here */}
            {plans.map((plan, index) => (
                <div key={`plan-${index}`} className="flex justify-between items-center p-2 rounded-md border-b-[1px] border-gray-200">
                    <div className="flex items-center gap-3">
                        <p>{plan.price}</p>
                        <div>
                            <p>{plan.name}</p>
                            <p>{plan.credits}</p>
                        </div>
                    </div>
                    <Button disabled={planButtonText(plan) === "Current Plan" || planButtonText(plan) === "Contact Support"} onClick={() => handlePlanButton(plan)}>{planButtonText(plan)}</Button>
                </div>
            ))}
        </div>
    )
}
