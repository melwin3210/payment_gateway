"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface PaymentStatus {
  status: string
  payuPaymentReference: string
  merchantPaymentReference: string
}

export default function PaymentReturnPage() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Get payment reference from URL params or localStorage
        const merchantRef =
          searchParams.get("merchantPaymentReference") || localStorage.getItem("merchantPaymentReference")

        if (!merchantRef) {
          throw new Error("No payment reference found")
        }

        const response = await fetch(`/api/payu/status/${merchantRef}`)
        const result = await response.json()

        if (result.success) {
          setPaymentStatus(result.data)
        } else {
          throw new Error(result.error || "Failed to check payment status")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    checkPaymentStatus()
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Checking payment status...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <XCircle className="mr-2 h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button className="mt-4" onClick={() => (window.location.href = "/payment")}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isSuccess = paymentStatus?.status === "AUTHORIZED" || paymentStatus?.status === "CAPTURED"

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className={`flex items-center ${isSuccess ? "text-green-600" : "text-red-600"}`}>
            {isSuccess ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Payment Successful
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-5 w-5" />
                Payment Failed
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isSuccess
              ? "Your payment has been processed successfully."
              : "There was an issue processing your payment."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentStatus && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium">{paymentStatus.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Reference:</span>
                <span className="font-medium">{paymentStatus.payuPaymentReference}</span>
              </div>
              <div className="flex justify-between">
                <span>Order Reference:</span>
                <span className="font-medium">{paymentStatus.merchantPaymentReference}</span>
              </div>
            </div>
          )}
          <Button className="w-full" onClick={() => (window.location.href = "/")}>
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
