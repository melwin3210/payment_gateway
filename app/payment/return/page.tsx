"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Get payment reference from URL params or localStorage
        const merchantRef =
          searchParams.get("merchantPaymentReference") || localStorage.getItem("merchantPaymentReference")

        if (!merchantRef) {
          throw new Error("No payment reference found")
        }

        // Wait a bit longer before first check to allow payment processing
        await new Promise((resolve) => setTimeout(resolve, 3000))

        const response = await fetch(`/api/payu/status/${merchantRef}`)
        const result = await response.json()

        if (result.success) {
          const status = result.data.status || result.data.authorization?.authorized

          // If payment is still pending, keep checking
          if (status === "PENDING" || status === "PENDING_AUTHORIZATION") {
            console.log("Payment still pending, will retry...")
            // Retry after 5 seconds
            setTimeout(() => {
              window.location.reload()
            }, 5000)
            return
          }

          setPaymentStatus(result.data)
        } else {
          throw new Error(result.error || "Failed to check payment status")
        }
      } catch (err) {
        console.error("Status check error:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    checkPaymentStatus()
  }, [searchParams])

  const recheckStatus = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const merchantRef =
        searchParams.get("merchantPaymentReference") || localStorage.getItem("merchantPaymentReference")

      if (!merchantRef) {
        throw new Error("No payment reference found")
      }

      const response = await fetch(`/api/payu/status/${merchantRef}`)
      const result = await response.json()

      if (result.success) {
        setPaymentStatus(result.data)

        toast({
          title: "Status Updated",
          description: `Payment status: ${result.data.status}`,
        })
      } else {
        throw new Error(result.error || "Failed to check payment status")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <div className="text-center">
              <h3 className="font-semibold">Checking payment status...</h3>
              <p className="text-sm text-muted-foreground mt-2">Please wait while we verify your payment with PayU</p>
              <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
            </div>
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
            <CardTitle className="flex items-center text-orange-600">
              <XCircle className="mr-2 h-5 w-5" />
              Status Check Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{error}</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-700 mb-2">
                If you just completed payment on PayU, it may take a moment to process.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={recheckStatus} disabled={isLoading} className="flex-1">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Check Status Again
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/payment")} className="flex-1">
                New Payment
              </Button>
            </div>
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
