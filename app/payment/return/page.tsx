"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentStatus {
  status: string
  payuPaymentReference: string
  merchantPaymentReference: string
  amount?: string
  authorization?: {
    authorized: string
  }
}

export default function PaymentReturnPage() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [urlParams, setUrlParams] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Safely extract URL parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const params: Record<string, string> = {}
        const urlSearchParams = new URLSearchParams(window.location.search)

        // Log all parameters for debugging
        console.log("URL search string:", window.location.search)
        console.log("Full URL:", window.location.href)

        for (const [key, value] of urlSearchParams.entries()) {
          params[key] = value
          console.log(`URL param: ${key} = ${value}`)
        }

        setUrlParams(params)
      } catch (error) {
        console.error("Error parsing URL parameters:", error)
        // Continue without URL params
      }
    }
  }, [])

  const checkPaymentStatus = async (isManualRetry = false) => {
    if (!isManualRetry) {
      setIsLoading(true)
    }
    setError(null)

    try {
      // Try multiple sources for the payment reference
      const merchantRef =
        // First try localStorage
        localStorage.getItem("merchantPaymentReference") ||
        // Then try URL parameters
        urlParams.merchantPaymentReference ||
        urlParams.reference ||
        urlParams.orderRef ||
        // Try other common parameter names PayU might use
        urlParams.merchant_reference ||
        urlParams.order_id

      console.log("Available URL params:", urlParams)
      console.log("Checking payment status for reference:", merchantRef)

      if (!merchantRef) {
        // If no reference found, show a helpful message
        throw new Error(
          "No payment reference found. This usually means you accessed this page directly. Please start a new payment.",
        )
      }

      // For first check, wait a bit to allow payment processing
      if (!isManualRetry && retryCount === 0) {
        console.log("First check - waiting 3 seconds for payment processing...")
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }

      const response = await fetch(`/api/payu/status/${merchantRef}`)
      const result = await response.json()

      console.log("Payment status response:", result)

      if (result.success) {
        const status = result.data.status || result.data.authorization?.authorized || "UNKNOWN"
        console.log("Payment status:", status)

        // Check if payment is still processing
        if ((status === "PENDING" || status === "PENDING_AUTHORIZATION" || status === "CREATED") && retryCount < 5) {
          console.log(`Payment still pending (attempt ${retryCount + 1}/5), will retry...`)

          toast({
            title: "Payment Processing",
            description: `Checking payment status... (${retryCount + 1}/5)`,
          })

          // Retry after 5 seconds
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
            checkPaymentStatus()
          }, 5000)
          return
        }

        setPaymentStatus(result.data)

        if (status === "AUTHORIZED" || status === "CAPTURED") {
          toast({
            title: "Payment Successful!",
            description: "Your payment has been processed successfully.",
          })
        } else if (status === "FAILED" || status === "DECLINED") {
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed.",
            variant: "destructive",
          })
        }
      } else {
        throw new Error(result.error || "Failed to check payment status")
      }
    } catch (err) {
      console.error("Status check error:", err)
      const errorMessage = err instanceof Error ? err.message : "An error occurred while checking payment status"
      setError(errorMessage)

      toast({
        title: "Status Check Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Wait for URL params to be parsed before checking status
    const timer = setTimeout(() => {
      checkPaymentStatus()
    }, 500)

    return () => clearTimeout(timer)
  }, [urlParams])

  const handleManualRetry = () => {
    setRetryCount(0)
    checkPaymentStatus(true)
  }

  const goHome = () => {
    // Clear localStorage and go home
    localStorage.removeItem("payuPaymentReference")
    localStorage.removeItem("merchantPaymentReference")
    localStorage.removeItem("paymentStartTime")
    localStorage.removeItem("paymentAmount")
    window.location.href = "/"
  }

  const startNewPayment = () => {
    // Clear localStorage and go to payment page
    localStorage.removeItem("payuPaymentReference")
    localStorage.removeItem("merchantPaymentReference")
    localStorage.removeItem("paymentStartTime")
    localStorage.removeItem("paymentAmount")
    window.location.href = "/payment"
  }

  if (isLoading && retryCount === 0) {
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

  if (error && !paymentStatus) {
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

            {/* Debug information */}
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs">
              <p className="font-semibold mb-2">Debug Information:</p>
              <p>URL: {typeof window !== "undefined" ? window.location.href : "N/A"}</p>
              <p>URL Params: {JSON.stringify(urlParams)}</p>
              <p>
                LocalStorage Ref:{" "}
                {typeof window !== "undefined" ? localStorage.getItem("merchantPaymentReference") : "N/A"}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-700 mb-2">
                If you just completed payment on PayU, it may take a moment to process.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleManualRetry} disabled={isLoading} className="flex-1">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Check Again
              </Button>
              <Button variant="outline" onClick={startNewPayment} className="flex-1 bg-transparent">
                New Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isSuccess =
    paymentStatus?.status === "AUTHORIZED" ||
    paymentStatus?.status === "CAPTURED" ||
    paymentStatus?.authorization?.authorized === "YES"

  const isPending =
    paymentStatus?.status === "PENDING" ||
    paymentStatus?.status === "PENDING_AUTHORIZATION" ||
    paymentStatus?.status === "CREATED"

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle
            className={`flex items-center ${
              isSuccess ? "text-green-600" : isPending ? "text-orange-600" : "text-red-600"
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Payment Successful
              </>
            ) : isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Payment Processing
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
              : isPending
                ? "Your payment is being processed. Please wait..."
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
              {paymentStatus.payuPaymentReference && (
                <div className="flex justify-between">
                  <span>Payment Reference:</span>
                  <span className="font-medium font-mono text-xs">{paymentStatus.payuPaymentReference}</span>
                </div>
              )}
              {paymentStatus.merchantPaymentReference && (
                <div className="flex justify-between">
                  <span>Order Reference:</span>
                  <span className="font-medium font-mono text-xs">{paymentStatus.merchantPaymentReference}</span>
                </div>
              )}
              {paymentStatus.amount && (
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">{paymentStatus.amount} RUB</span>
                </div>
              )}
            </div>
          )}

          {isPending && (
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <p className="text-sm text-orange-700">
                Payment is still being processed. We'll automatically check again in a few seconds.
              </p>
            </div>
          )}

          {/* Debug section for troubleshooting */}
          <details className="text-xs text-gray-400">
            <summary className="cursor-pointer">Debug Information</summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
              <p>
                <strong>URL:</strong> {typeof window !== "undefined" ? window.location.href : "N/A"}
              </p>
              <p>
                <strong>URL Params:</strong> {JSON.stringify(urlParams, null, 2)}
              </p>
              <p>
                <strong>Payment Status:</strong> {JSON.stringify(paymentStatus, null, 2)}
              </p>
            </div>
          </details>

          <div className="flex gap-2">
            {!isSuccess && (
              <Button
                onClick={handleManualRetry}
                disabled={isLoading}
                variant="outline"
                className="flex-1 bg-transparent"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Check Again
              </Button>
            )}
            <Button onClick={goHome} className={!isSuccess ? "flex-1" : "w-full"}>
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
