"use client"

import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function PaymentSuccessPage() {
  useEffect(() => {
    // Simple redirect to the return page
    const timer = setTimeout(() => {
      window.location.href = "/payment/return"
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Redirecting to payment status...</span>
        </CardContent>
      </Card>
    </div>
  )
}
