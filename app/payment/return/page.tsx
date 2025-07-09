"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentStatus {
  status: string
  payuPaymentReference: string
  merchantPaymentReference: string
  message?: string
  isFromCallback?: boolean
}

export default function PaymentReturnPage() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params: Record<string, string> = {}
      const urlSearchParams = new URLSearchParams(window.location.search)

      for (const [key, value] of urlSearchParams.entries()) {
        params[key] = value
      }

      // Check localStorage for callback data
      const callbackData = localStorage.getItem("payuCallbackData")
      const callbackTimestamp = localStorage.getItem("payuCallbackTimestamp")

      if (callbackData) {
        try {
          const parsedCallbackData = JSON.parse(callbackData)
          const timestamp = Number.parseInt(callbackTimestamp || "0")
          const isRecent = Date.now() - timestamp < 5 * 60 * 1000

          if (isRecent) {
            const callbackStatus: PaymentStatus = {
              merchantPaymentReference: parsedCallbackData.merchantPaymentReference,
              payuPaymentReference: parsedCallbackData.payuPaymentReference || "N/A",
              status: parsedCallbackData.status,
              message: parsedCallbackData.message,
              isFromCallback: true,
            }

            setPaymentStatus(callbackStatus)
            setIsLoading(false)

            if (parsedCallbackData.isSuccess) {
              toast({
                title: "Payment Successful!",
                description: "Your payment has been processed.",
              })
            } else {
              toast({
                title: "Payment Status",
                description: `Status: ${parsedCallbackData.status}`,
                variant: "destructive",
              })
            }

            localStorage.removeItem("payuCallbackData")
            localStorage.removeItem("payuCallbackTimestamp")
            return
          }
        } catch (error) {
          localStorage.removeItem("payuCallbackData")
          localStorage.removeItem("payuCallbackTimestamp")
        }
      }

      // Check URL parameters
      if (params.reference && params.status) {
        const callbackStatus: PaymentStatus = {
          merchantPaymentReference: params.reference,
          payuPaymentReference: params.payuRef || "N/A",
          status: params.status,
          message: params.message ? decodeURIComponent(params.message) : undefined,
          isFromCallback: true,
        }

        setPaymentStatus(callbackStatus)
        setIsLoading(false)

        if (params.success === "true") {
          toast({
            title: "Payment Successful!",
            description: "Your payment has been processed.",
          })
        }
      } else {
        setIsLoading(false)
      }
    }
  }, [toast])

  const goHome = () => {
    localStorage.removeItem("payuPaymentReference")
    localStorage.removeItem("merchantPaymentReference")
    window.location.href = "/"
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Checking payment status...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isSuccess = paymentStatus?.status === "SUCCESS" || paymentStatus?.status === "AUTHORIZED"

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
            {isSuccess ? "Your payment has been processed successfully." : "There was an issue with your payment."}
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
                <span>Reference:</span>
                <span className="font-medium font-mono text-xs">{paymentStatus.merchantPaymentReference}</span>
              </div>
              {paymentStatus.message && (
                <div className="flex justify-between">
                  <span>Message:</span>
                  <span className="font-medium">{paymentStatus.message}</span>
                </div>
              )}
            </div>
          )}

          <Button onClick={goHome} className="w-full">
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
