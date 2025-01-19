'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect } from "react"
import { checkAuth } from "../console/actions"
import { redirect } from "next/navigation"
import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    handleCheckAuth()
  }, [])

  const handleCheckAuth = async () => {
    const auth = await checkAuth()
    if (auth) {
      redirect('/console')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader className="flex flex-col items-center">
          <Image src="/logo.svg" alt="Rowfill Logo" width={50} height={50} />
          <CardTitle className="text-lg pt-2">Authentication</CardTitle>
          <p className="text-sm text-gray-500">Login or sign up to your account</p>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
